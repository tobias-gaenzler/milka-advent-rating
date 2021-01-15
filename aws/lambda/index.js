// POST: {\"Rating\":{\"UserName\":\"Emil\",\"ChocolateBar\":1,\"Value\":2.5}}"
// GET: userName=Emil&ChocolateBar=1

const randomBytes = require('crypto').randomBytes;
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    console.log('Received event: ', event);
    if (event.rawPath.includes('/list')) {
        getRatingList().then((result) => {
            console.log("retrieved all ratings: " + result);
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    ratingList: result.Items,
                }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            });
        });
    }
    else if (event.routeKey.includes('GET /milkarating')) {
        console.log(event.queryStringParameters);
        if (event["queryStringParameters"] == null ||
            event["queryStringParameters"]["UserName"] == null ||
            event["queryStringParameters"]["ChocolateBar"] == null) {
            console.error('Validation Failed');
            errorResponse('Couldn\'t get rating because user name and/or chocolate bar have not been provided as query string parameters', context.awsRequestId, callback);
        }
        var userName = event["queryStringParameters"]["UserName"];
        var chocolateBar = event["queryStringParameters"]["ChocolateBar"];
        getRating(userName, chocolateBar).then((result) => {
            console.log("retrieve result from promise: " + result);
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    Value: result,
                }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            });
        });
    }
    else if (event.routeKey.includes('POST')) {
        // POST: insert or update of existing rating
        const requestBody = JSON.parse(event.body);
        const rating = requestBody.Rating;
        upsertRating(rating).then(() => {
            // You can use the callback function to provide a return value from your Node.js
            // Lambda functions. The first parameter is used for failed invocations. The
            // second parameter specifies the result data of the invocation.

            // Because this Lambda function is called by an API Gateway proxy integration
            // the result object must use the following structure.
            callback(null, {
                statusCode: 201,
                body: JSON.stringify({
                    RatingId: rating.ratingid,
                    UserName: rating.UserName,
                    ChocolateBar: rating.ChocolateBar,
                    Value: rating.Value
                }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }).catch((err) => {
            console.error(err);

            // If there is an error during processing, catch it and return
            // from the Lambda function successfully. Specify a 500 HTTP status
            // code and provide an error message in the body. This will provide a
            // more meaningful error response to the end client.
            errorResponse(err.message, context.awsRequestId, callback);
        });
    }
};

async function getRatingList() {
    var today = new Date();
    var yesterday = today.getUTCDate() - 1;
    var chocolateBarValues = [];
    for (var i = 1; i <= yesterday; i++) {
        chocolateBarValues.push(i.toString());
    }
    var chocolateBarObject = {};
    var index = 0;
    chocolateBarValues.forEach(function(value) {
        index++;
        var chocolateBarKey = ":chocolatebarvalue" + index;
        chocolateBarObject[chocolateBarKey.toString()] = value;
    });
    console.log("values: ", chocolateBarValues);
    console.log("objects:", chocolateBarObject);
    console.log("keys:", Object.keys(chocolateBarObject).toString());
    var params = {
        TableName: "milkarating",
        ProjectionExpression: "UserName, ChocolateBar, #ratingValue",
        FilterExpression: "ChocolateBar IN (" + Object.keys(chocolateBarObject).toString() + ")",
        ExpressionAttributeValues: chocolateBarObject,
        ExpressionAttributeNames: {
            "#ratingValue": "Value"
        },
    };

    return ddb
        .scan(params, function(err, data) {
            console.log("Result of scanning for ratings:", JSON.stringify(data, null, 2));
            if (err) {
                console.log('Error scanning for ratings:', err);
            }
        })
        .promise();
}

async function scanForExistingRating(userName, chocolateBar) {
    var params = {
        TableName: "milkarating",
        ProjectionExpression: "ratingid, UserName, ChocolateBar, #ratingValue",
        FilterExpression: "UserName = :username and ChocolateBar = :chocolateBar",
        ExpressionAttributeNames: {
            "#ratingValue": "Value"
        },
        ExpressionAttributeValues: {
            ":username": userName,
            ":chocolateBar": chocolateBar,
        }
    };
    return ddb.scan(params, function(err, data) {
        console.log("Result of scanning for existing rating:", JSON.stringify(data, null, 2));
        if (err) {
            console.log('Error scanning for existing ratings:', err);
        }
    }).promise();
}

async function getRating(userName, chocolateBar) {
    var result = '0';
    try {
        var scanResult = await scanForExistingRating(userName, chocolateBar);
        console.log("scanResult.Count" + scanResult.Count);
        if (scanResult.Count > 0) {
            console.log("Found value" + scanResult.Items[0].Value);
            result = scanResult.Items[0].Value;
        }
        else {
            result = '0';
        }
    }
    catch (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    }
    console.log("Returning value in promise: " + result);
    return new Promise(function(resolve, reject) {
        resolve(result);
    });
}

async function upsertRating(rating) {
    var ratingid = '';
    try {
        var scanResult = await scanForExistingRating(rating.UserName, rating.ChocolateBar);
        console.log("scanResult" + scanResult);
        if (scanResult.Count > 0) {
            ratingid = scanResult.Items[0].ratingid;
        }
        else {
            ratingid = toUrlString(randomBytes(16));
        }
    }
    catch (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    }
    // put upserts if ratingid matches
    return ddb.put({
        TableName: 'milkarating',
        Item: {
            ratingid: ratingid,
            UserName: rating.UserName,
            ChocolateBar: rating.ChocolateBar,
            Value: rating.Value,
            RequestTime: new Date().toISOString(),
        },
    }, function(err, data) {
        if (err) {
            console.error("Unable to insert rating. Error JSON:", err);
        }
        else {
            console.log("Insert rating succeeded:", ratingid, JSON.stringify(data, null, 2));
        }

    }).promise();
}

function toUrlString(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function errorResponse(errorMessage, awsRequestId, callback) {
    callback(null, {
        statusCode: 500,
        body: JSON.stringify({
            Error: errorMessage,
            Reference: awsRequestId,
        }),
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    });
}
