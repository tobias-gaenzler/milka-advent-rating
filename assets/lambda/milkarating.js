// POST: {\"Rating\":{\"UserName\":\"Emil\",\"ChocolateBar\":1,\"Value\":2.5}}"
// GET: userName=Emil&ChocolateBar=1

const randomBytes = require('crypto').randomBytes;
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const getRating = (userName, chocolateBar, rating) => {
    console.log('Getting rating');
    var params = {
        TableName: "milkarating",
        ProjectionExpression: "ratingid, UserName, ChocolateBar",
        FilterExpression: "UserName = :userName and ChocolateBar = :chocolateBar",
        ExpressionAttributeValues: {
            ":userName": userName,
            ":chocolateBar": chocolateBar,
        }
    };
    return ddb.scan(params, function(err, data) {
        console.log("Result of scanning for existing rating:", JSON.stringify(data, null, 2));
        if (err) {
            console.log('Error scanning for existing ratings:', err);
        }
    }).promise();
};

exports.handler = (event, context, callback) => {
    console.log('Received event: ', event);
    if (event.routeKey.includes('GET')) {
        console.log(event.queryStringParameters);
        if (event["queryStringParameters"] == null ||
            event["queryStringParameters"]["UserName"] == null ||
            event["queryStringParameters"]["ChocolateBar"] == null) {
            console.error('Validation Failed');
            callback(new Error('Couldn\'t get rating because user name and/or chocolate bar have not been provided as query string parameters'));
            return;
        }
        var userName = event["queryStringParameters"]["UserName"];
        var chocolateBar = event["queryStringParameters"]["ChocolateBar"];
        getRating(userName, chocolateBar)
            .then(result => {
                console.log("Retrieved ratings" + result);
                var value = '0';
                if (result.Count > 0) {
                    value = result.Items[0].Value;
                }
                callback(null, {
                    statusCode: 200,
                    body: JSON.stringify({
                        Value: value,
                    }),
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                })
            })
            .catch(err => {
                console.log(err);
                callback(null, {
                    statusCode: 500,
                    body: JSON.stringify({
                        message: 'Unable to get rating for ${userName} and chocolate bar ${chocolateBar}',
                    })
                })
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
            errorResponse(err.message, context.awsRequestId, callback)
        });
    }
};

async function scanForExistingRating(rating) {
    var params = {
        TableName: "milkarating",
        ProjectionExpression: "ratingid, UserName, ChocolateBar",
        FilterExpression: "UserName = :username and ChocolateBar = :chocolateBar",
        ExpressionAttributeValues: {
            ":username": rating.UserName,
            ":chocolateBar": rating.ChocolateBar,
        }
    };
    return ddb.scan(params, function(err, data) {
        console.log("Result of scanning for existing rating:", JSON.stringify(data, null, 2));
        if (err) {
            console.log('Error scanning for existing ratings:', err);
        }
    }).promise();
}

async function upsertRating(rating) {
    var ratingid = '';
    try {
        var scanResult = await scanForExistingRating(rating);
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
            console.log("Insert rating succeeded:", JSON.stringify(data, null, 2));
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
