const randomBytes = require('crypto').randomBytes;
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    console.log('Received event: ', event);
    if (event.routeKey == 'GET /list') {
        getRatingList().then((result) => {
            console.log("retrieved all ratings: " + result);
            returnResult(callback, JSON.stringify({ ratingList: result.Items, }));
        });
    }
    else if (event.routeKey == 'GET /milkarating') {
        var userName = event["queryStringParameters"]["UserName"];
        var chocolateBar = event["queryStringParameters"]["ChocolateBar"];
        getRating(userName, chocolateBar).then((result) => {
            console.log("retrieve result from promise: " + result);
            returnResult(callback, JSON.stringify({ Value: result, }));
        });
    }
    else if (event.routeKey == 'POST /milkarating') {
        // POST: insert or update of existing rating
        var requestBody;
        if(typeof event.body == "object") {
            requestBody = event.body;
        } else {
            requestBody = JSON.parse(event.body);
        }        
        const rating = requestBody.Rating;
        upsertRating(rating).then(() => {
            returnResult(callback, JSON.stringify({ RatingId: rating.ratingid }));
        }).catch((err) => {
            console.error(err);
            errorResponse(err.message, context.awsRequestId, callback);
        });
    }
};

async function getRatingList() {
    var chocolateBarObject = getFilterMapForAvailableChocolateBars(new Date());
    var params = {
        TableName: "milkarating",
        ProjectionExpression: "UserName, ChocolateBar, #ratingValue",
        FilterExpression: "ChocolateBar IN (" + Object.keys(chocolateBarObject).toString() + ")",
        ExpressionAttributeValues: chocolateBarObject,
        ExpressionAttributeNames: { "#ratingValue": "Value" },
    };

    return ddb
        .scan(params, function (err, data) {
            console.log("Result of scanning for ratings:", JSON.stringify(data, null, 2));
            if (err) {
                console.log('Error scanning for ratings:', err);
            }
        })
        .promise();
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
    }
    catch (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    }
    console.log("Returning value in promise: " + result);
    return new Promise(function (resolve, reject) {
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
    }, function (err, data) {
        if (err) {
            console.error("Unable to insert rating. Error JSON:", err);
        }
        else {
            console.log("Insert rating succeeded:", ratingid, JSON.stringify(data, null, 2));
        }

    }).promise();
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
    return ddb.scan(params, function (err, data) {
        console.log("Result of scanning for existing rating:", JSON.stringify(data, null, 2));
        if (err) {
            console.log('Error scanning for existing ratings:', err);
        }
    }).promise();
}


function getFilterMapForAvailableChocolateBars(today) {
    // Keys are used in FilterExpression: ChocolateBar IN (:chocolatebarvalue1,:chocolatebarvalue2,...)
    // Map is used in ExpressionAttributeValues: {':chocolatebarvalue1': '1',':chocolatebarvalue2': '2',...}
    var count = 0;
    if (today < new Date(2020, 11, 2, 1, 1, 1)) {
        return '';
    } else if (today > new Date(2020, 11, 25, 1)) {
        count = 24;
    } else {
        count = today.getUTCDate() - 1;
    }
    var filterMap = {};
    for (var i = 1; i <= count; i++) {
        filterMap[`:chocolatebarvalue${i}`] = i.toString();
    }
    return filterMap;
}

function returnResult(callback, body) {
    callback(null, {
        statusCode: 200,
        body: body,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    });
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
