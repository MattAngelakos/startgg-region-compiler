const sortLev = (inputs, search, type) => {
    const searchLower = search.toLowerCase();
    function calculateLevenshtein(input, search, x, y) {
        input = input.toLowerCase();
        if (input.includes(search)) return 0;
        if (x === 0) return y;
        if (y === 0) return x;
        const dp = Array(x + 1).fill(null).map(() => Array(y + 1).fill(null));
        for (let i = 0; i <= x; i++) { dp[i][0] = i }
        for (let j = 0; j <= y; j++) { dp[0][j] = j; }
        for (let i = 1; i <= x; i++) {
            for (let j = 1; j <= y; j++) {
                const substitutionCost = input[i - 1] === search[j - 1] ? 0 : 1;
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1] + substitutionCost
                );
            }
        }
        return dp[x][y];
    }
    for (let i = 1; i < inputs.length; i++) {
        let current = inputs[i];
        let currentLev = calculateLevenshtein(current[type], searchLower, current[type].length, searchLower.length);
        let j = i - 1;

        while (j >= 0 && (
            calculateLevenshtein(inputs[j][type], searchLower, inputs[j][type].length, searchLower.length) > currentLev ||
            (calculateLevenshtein(inputs[j][type], searchLower, inputs[j][type].length, searchLower.length) === currentLev && inputs[j]._id > current._id)
        )) {
            inputs[j + 1] = inputs[j];
            j--;
        }
        inputs[j + 1] = current;
    }
    return inputs;
}

const sortLev2 = (inputs, search, type) => {
    const searchLower = search.toLowerCase();
    function calculateLevenshtein(input, search, x, y) {
        input = input.toLowerCase();
        if (input.includes(search)) return 0;
        if (x === 0) return y;
        if (y === 0) return x;
        const dp = Array(x + 1).fill(null).map(() => Array(y + 1).fill(null));
        for (let i = 0; i <= x; i++) { dp[i][0] = i }
        for (let j = 0; j <= y; j++) { dp[0][j] = j; }
        for (let i = 1; i <= x; i++) {
            for (let j = 1; j <= y; j++) {
                const substitutionCost = input[i - 1] === search[j - 1] ? 0 : 1;
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1] + substitutionCost
                );
            }
        }
        return dp[x][y];
    }
    for (let i = 1; i < inputs.length; i++) {
        let current = inputs[i];
        let currentLev = calculateLevenshtein(current.tournament[type], searchLower, current.tournament[type].length, searchLower.length);
        let j = i - 1;

        while (j >= 0 && (
            calculateLevenshtein(inputs[j].tournament[type], searchLower, inputs[j].tournament[type].length, searchLower.length) > currentLev ||
            (calculateLevenshtein(inputs[j].tournament[type], searchLower, inputs[j].tournament[type].length, searchLower.length) === currentLev && inputs[j]._id > current._id)
        )) {
            inputs[j + 1] = inputs[j];
            j--;
        }
        inputs[j + 1] = current;
    }
    return inputs;
}

const finish_h2h = (h2h) => {
    const keys = Object.keys(h2h)
    for (let i = keys.length - 1; i >= 0; i--) {
        //console.log(`i: ${keys[i]}`)
        const keyI = keys[i];
        for (let j = 0; j < i; j++) {
            //console.log(`j: ${keys[j]}`)
            const keyJ = keys[j];
            const temp = h2h[keyJ][keyI];
            h2h[keyI][keyJ] = { wins: temp.losses, losses: temp.wins };
        }
    }
    return h2h
}

const do_elo = (h2h) => {
    for (let player in h2h) {
        h2h[player].elo = 1500
    }
    function Probability(rating1, rating2) {
        return (
            (1.0 * 1.0) / (1 + 1.0 * Math.pow(10, (1.0 * (rating1 - rating2)) / 400))
        );
    }
    function EloRating(player, opponent, K, d) {
        let Ra = h2h[player].elo
        let Rb = h2h[opponent].elo
        let Pb = Probability(Ra, Rb);
        let Pa = Probability(Rb, Ra);
        if (d === true) {
            Ra = Ra + K * (1 - Pa);
            Rb = Rb + K * (0 - Pb);
        }
        else {
            Ra = Ra + K * (0 - Pa);
            Rb = Rb + K * (1 - Pb);
        }
        h2h[player].elo = Ra
        h2h[opponent].elo = Rb
    }
    for (let player in h2h) {
        for (let opponent in h2h[player]) {
            if (opponent !== 'id' && opponent !== 'rating' && opponent !== 'deviation' && opponent !== 'volatility' && opponent !== 'elo') {
                const wins = h2h[player][opponent].wins;
                const losses = h2h[player][opponent].losses;
                for (let i = 0; i < wins; i++) {
                    EloRating(player, opponent, 30, true);
                }
                for (let i = 0; i < losses; i++) {
                    EloRating(player, opponent, 30, false);
                }
            }
        }
    }
    return h2h
}

const do_glicko2 = (h2h) => {
    function G(p) {
        const scale = p / Math.PI
        return 1.0 / Math.pow((1.0 + 3.0 * scale * scale), 0.5)
    }
    function E(g, u, uj) {
        const exponent = -1.0 * g * (u - uj)
        return 1.0 / (1.0 + Math.pow(Math.E, exponent))
    }
    function F(x, dS, pS, v, a, tS) {
        let eX = Math.pow(Math.E, x)
        let num = eX * (dS - pS - v - eX)
        let den = pS + v + eX
        return (num / (2.0 * den * den)) - ((x - a) / tS)
    }
    function update(m, opponent, score, player) {
        let invV = 0.0
        const g = G(opponent.deviation)
        const e = E(g, player.rating, opponent.rating)
        invV += g * g * e * (1.0 - e)
        const v = 1.0 / invV
        let dInner = 0.0
        for (let j = 0; j < m; j++) {
            dInner += g * (score[j] - e);
        }
        const d = v * dInner;
        const sPrime = Math.pow(Math.E, (Convergence(d, v, player.deviation, player.volatility) / 2.0))
        const pPrime = 1.0 / Math.pow(((1.0 / (player.deviation * player.deviation + sPrime * sPrime)) + invV), 0.5);
        const uPrime = player.rating + pPrime * pPrime * dInner;
        return {uPrime, pPrime, sPrime}
    }
    function Convergence(d, v, p, s) {
        let dS = d * d;
        let pS = p * p;
        let tS = 0.5 * 0.5;
        let a = Math.log(s * s);
        let A = a;
        let B;
        let bTest = dS - pS - v;
        if (bTest > 0.0) {
            B = Math.log(bTest);
        }
        else {
            B = a - 0.5;
            while (F(B, dS, pS, v, a, tS) < 0.0) {
                B -= 0.5;
            }
        }
        let fA = F(A, dS, pS, v, a, tS);
        let fB = F(B, dS, pS, v, a, tS);
        while (Math.abs(B - A) >  0.000001)
        {
            let C = A + (A - B) * fA / (fB - fA);
            let fC = F(C, dS, pS, v, a, tS);

            if (fC * fB < 0.0) {
                A = B;
                fA = fB;
            }
            else {
                fA /= 2.0;
            }

            B = C;
            fB = fC;
        }
        return A;
    }
    for (let player in h2h) {
        h2h[player].rating = 0
        h2h[player].deviation = 350/173.7178
        h2h[player].volatility = 0.06
    }
    for (let player in h2h) {
        for (let opponent in h2h[player]) {
            if (opponent !== 'id' && opponent !== 'rating' && opponent !== 'deviation' && opponent !== 'volatility' && opponent !== 'elo') {
                const wins = h2h[player][opponent].wins;
                const losses = h2h[player][opponent].losses;
                let updatedRatings
                let updatedRatings2
                for (let i = 0; i < wins; i++) {
                    updatedRatings = update(1, h2h[opponent], [1], h2h[player])
                    updatedRatings2 = update(1, h2h[player], [0], h2h[opponent])
                    h2h[player].rating = updatedRatings.uPrime
                    h2h[player].deviation = updatedRatings.pPrime
                    h2h[player].volatility = updatedRatings.sPrime
                    h2h[opponent].rating = updatedRatings2.uPrime
                    h2h[opponent].deviation = updatedRatings2.pPrime
                    h2h[opponent].volatility = updatedRatings2.sPrime
                }
                for (let i = 0; i < losses; i++) {
                    updatedRatings = update(1, h2h[opponent], [0], h2h[player])
                    updatedRatings2 = update(1, h2h[player], [1], h2h[opponent])
                    h2h[player].rating = updatedRatings.uPrime
                    h2h[player].deviation = updatedRatings.pPrime
                    h2h[player].volatility = updatedRatings.sPrime
                    h2h[opponent].rating = updatedRatings2.uPrime
                    h2h[opponent].deviation = updatedRatings2.pPrime
                    h2h[opponent].volatility = updatedRatings2.sPrime
                }
            }
        }
    }
    for (let player in h2h) {
        h2h[player].rating = (h2h[player].rating*173.7178)+1500
        h2h[player].deviation = h2h[player].deviation*173.7178
        h2h[player].volatility = 0.06
    }
    return h2h
}
const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const calculateScore = (matches) => {
    let wins = 0;
    let losses = 0;

    matches.forEach(match => {
        if (match.type === 'win') {
            wins += 1;
        } else if (match.type === 'loss') {
            losses += 1;
        }
    });

    return { score: `${wins}-${losses}` };
};

const compareWinrate = (opponent1, opponent2) => {
    let wins1 = 0
    let wins2 = 0
    for (const match of opponent1.tournaments) {
        if (match.type === "win") {
            wins1 = wins1 + 1
        }
    }
    for (const match of opponent2.tournaments) {
        if (match.type === "win") {
            wins2 = wins2 + 1
        }
    }
    let val = (wins1 / opponent1.tournaments.length) - (wins2 / opponent2.tournaments.length)
    if (val === 0) {
        val = opponent1.tournaments.length - opponent2.tournaments.length
    }
    return val
}

export{
    sortLev,
    finish_h2h,
    do_elo,
    do_glicko2,
    formatDate,
    sortLev2,
    calculateScore,
    compareWinrate
};