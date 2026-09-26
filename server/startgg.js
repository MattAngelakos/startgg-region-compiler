import dotenv from 'dotenv'
dotenv.config()

const ENDPOINT = 'https://api.start.gg/gql/alpha'

// start.gg allows 80 requests per 60 seconds per token. We stay under that on
// purpose so a burst of retries can't push us over the edge.
const MAX_REQUESTS = Number(process.env.STARTGG_MAX_RPM || 45)
const WINDOW_MS = 60000
const MAX_RETRIES = Number(process.env.STARTGG_MAX_RETRIES || 5)
const DEBUG = process.env.STARTGG_DEBUG === 'true'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Thrown when a page is too big for the 1000-object cap, so callers can shrink
// perPage and try again instead of giving up.
class ComplexityError extends Error {
    constructor(message) {
        super(message)
        this.name = 'ComplexityError'
    }
}

let timestamps = []
// Slot reservation is serialized through this chain: without it two concurrent
// callers can both see room in the window and both take the last slot.
let queue = Promise.resolve()

const reserve = () => {
    const turn = queue.then(async () => {
        for (;;) {
            const now = Date.now()
            timestamps = timestamps.filter((t) => now - t < WINDOW_MS)
            if (timestamps.length < MAX_REQUESTS) {
                timestamps.push(now)
                return
            }
            await sleep(WINDOW_MS - (now - timestamps[0]) + 50)
        }
    })
    queue = turn.catch(() => {})
    return turn
}

const isComplexity = (errors) =>
    (errors || []).some((e) => (e.message || '').toLowerCase().includes('query complexity'))

const gqlRequest = async (query, variables = {}) => {
    let attempt = 0
    for (;;) {
        await reserve()
        let response
        try {
            response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.STARTGG_KEY}`
                },
                body: JSON.stringify({ query, variables })
            })
        } catch (e) {
            // Network blip: retry with backoff before giving up.
            if (attempt++ >= MAX_RETRIES) throw e
            await sleep(Math.min(2 ** attempt * 1000, 30000))
            continue
        }

        if (response.status === 429) {
            const retryAfter = Number(response.headers.get('retry-after'))
            const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : WINDOW_MS
            console.warn(`rate limited, waiting ${Math.round(wait / 1000)}s`)
            // A 429 means our window estimate is behind the server's; drop the
            // credit we think we have so we restart the window cleanly.
            timestamps = []
            await sleep(wait)
            if (attempt++ >= MAX_RETRIES) throw new Error('rate limited too many times')
            continue
        }

        if (response.status >= 500) {
            if (attempt++ >= MAX_RETRIES) throw new Error(`start.gg returned ${response.status}`)
            await sleep(Math.min(2 ** attempt * 1000, 30000))
            continue
        }

        let body
        try {
            body = await response.json()
        } catch (e) {
            if (attempt++ >= MAX_RETRIES) throw new Error(`unparseable response (HTTP ${response.status})`)
            await sleep(2000)
            continue
        }

        if (body.errors && isComplexity(body.errors)) {
            throw new ComplexityError(body.errors[0].message)
        }
        // Partial errors alongside data are normal (a deleted tournament in a
        // page of many); only a total failure is worth throwing over.
        if (body.errors && body.data == null) {
            throw new Error(body.errors.map((e) => e.message).join('; '))
        }
        if (body.errors) console.warn('partial errors:', body.errors.map((e) => e.message).join('; '))
        if (DEBUG) console.log('Query Response:', JSON.stringify(body).slice(0, 2000))
        return body
    }
}

export { gqlRequest, ComplexityError, sleep }
