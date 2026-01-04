export const formatAmount = (octas: string | number | bigint) => {
    const num = parseFloat(String(octas)) / 100_000_000;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
};

export const getTransferDetails = (payload: any) => {
    const args = payload.functionArguments;
    if (args && args.length >= 2) {
        return {
            recipient: String(args[0]),
            amount: String(args[1])
        };
    }
    return { recipient: 'Unknown', amount: '0' };
};
