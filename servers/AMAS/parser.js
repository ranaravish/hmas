/******************************************************************
 * PROJECT  : AMAS
 * FILE     : parser.js
 * VERSION  : 1.1
 * PURPOSE  : Technician Reply Parser
 ******************************************************************/

//-------------------------------------------------------
// Parser Service Switch
//-------------------------------------------------------

const PARSER_ENABLED = true;


//-------------------------------------------------------
// Parse Technician Reply
//-------------------------------------------------------

function parseReply(text)
{
    //---------------------------------------------------
    // Service Enabled ?
    //---------------------------------------------------

    if (!PARSER_ENABLED)
    {
        return {
            success: false,
            code: "SERVICE_DISABLED",
            complaintNo: "",
            status: "",
            originalText: text || ""
        };
    }

    //---------------------------------------------------
    // Original Message
    //---------------------------------------------------

    const originalText =
        String(text || "").trim();


    //---------------------------------------------------
    // Empty Message
    //---------------------------------------------------

    if (!originalText)
    {
        return {
            success: false,
            code: "EMPTY_MESSAGE",
            complaintNo: "",
            status: "",
            originalText
        };
    }


    //---------------------------------------------------
    // Normalize
    //---------------------------------------------------

    const normalizedText =
        originalText.toUpperCase().trim();


    //---------------------------------------------------
    // Result
    //---------------------------------------------------

    const result = {

        success: false,

        code: "",

        complaintNo: "",

        status: "",

        originalText

    };


    //---------------------------------------------------
    // Complaint / SR Number
    //---------------------------------------------------

    const match =
        normalizedText.match(
            /\b8\d{9}\b/
        );


    if (match)
    {
        result.complaintNo =
            match[0];
    }


    //---------------------------------------------------
    // Status
    //---------------------------------------------------

    if (
        /\bDONE\b/.test(
            normalizedText
        )
    )
    {
        result.status =
            "DONE";
    }
    else if (
        /\bOK\b/.test(
            normalizedText
        )
    )
    {
        result.status =
            "OK";
    }
    else if (
        /\bPENDING\b/.test(
            normalizedText
        )
    )
    {
        result.status =
            "PENDING";
    }


    //---------------------------------------------------
    // Validation
    //---------------------------------------------------

    if (!result.complaintNo)
    {
        result.code =
            "COMPLAINT_NOT_FOUND";

        return result;
    }


    if (!result.status)
    {
        result.code =
            "STATUS_NOT_FOUND";

        return result;
    }


    //---------------------------------------------------
    // Success
    //---------------------------------------------------

    result.success =
        true;

    result.code =
        "PARSED";


    return result;
}


//-------------------------------------------------------
// Export
//-------------------------------------------------------

module.exports = {
    parseReply
};