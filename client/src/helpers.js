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
    formatDate,
    sortLev2,
    calculateScore,
    compareWinrate
};