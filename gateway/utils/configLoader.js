/******************************************************************
 * HMAS - Hyper Messaging Automation System
 * ---------------------------------------------------------------
 * FILE        : configLoader.js
 * MODULE      : Configuration Loader
 * VERSION     : 1.0.0
 * AUTHOR      : Rana Ravish + Jarvis
 * CREATED     : 05-Aug-2026
 * MODIFIED    : 05-Aug-2026
 * ---------------------------------------------------------------
 * DESCRIPTION :
 * Loads HMAS configuration files.
 * Currently supports:
 *   - Server Configuration
 *
 * Future Support:
 *   - Service Policies
 *   - Global Configuration
 *   - Runtime Configuration
 ******************************************************************/

const fs = require("fs");
const path = require("path");


//-------------------------------------------------------
// Load Server Configuration
//-------------------------------------------------------

function getServer(serverId)
{


    
    const configFile = path.join(

        __dirname,

        "..",

        "config",

        "servers",

        serverId + ".json"

    );


    if (!fs.existsSync(configFile))
    {

        return null;

    }


    return JSON.parse(

        fs.readFileSync(configFile, "utf8")

    );

}

//-------------------------------------------------------
// Load Service Policy
//-------------------------------------------------------

function getPolicy(serviceName)
{

    const policyFile = path.join(

        __dirname,

        "..",

        "config",

        "services_policies",

        serviceName + ".json"

    );

    if (!fs.existsSync(policyFile))
    {

        return null;

    }

    return JSON.parse(

        fs.readFileSync(policyFile, "utf8")

    );

}


//-------------------------------------------------------
// Export Module
//-------------------------------------------------------

module.exports = {

    getServer,
    getPolicy

};


/******************************************************************
 * End of File
 ******************************************************************/