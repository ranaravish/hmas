function parseReply(text) {

    const original = text;

    text = text.toUpperCase().trim();

    const result = {
        complaintNo: "",
        status: "",
        originalText: original
    };

    const match = text.match(/\b8\d{9}\b/);

    if (match) {
        result.complaintNo = match[0];
    }

    if (/\bDONE\b/.test(text))
        result.status = "DONE";
    else if (/\bOK\b/.test(text))
        result.status = "OK";
    else if (/\bPENDING\b/.test(text))
        result.status = "PENDING";

    return result;
}

module.exports = { parseReply };