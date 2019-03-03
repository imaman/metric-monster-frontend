const AWS = require('aws-sdk');

export async function callLambda(functionName, request) {
    const lambda = new AWS.Lambda({region: 'eu-central-1'});
    const params = {
        FunctionName: functionName,
        InvocationType: "RequestResponse", 
        Payload: JSON.stringify(request)
    };

    const lambdaWrappedResponse = await lambda.invoke(params).promise();    
    if (lambdaWrappedResponse.FunctionError) {
        const errorMessage = JSON.parse(lambdaWrappedResponse.Payload).errorMessage;
        throw new Error("Backend request returned with the following error: " + errorMessage);
    } 
    
    
    const ret = JSON.parse(lambdaWrappedResponse.Payload);
    return ret;
}

