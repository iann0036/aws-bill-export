const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const winston = require('winston')
const rp = require('request-promise')

const LOG = winston.createLogger({
    level: "debug",
    transports: [
        new winston.transports.Console()
    ]
});

var cookie = "";
var xsrftoken = "";

async function login(page) {
    let signintoken = await rp('https://signin.aws.amazon.com/federation?Action=getSigninToken&Session=' + encodeURIComponent(JSON.stringify({
        'sessionId': process.env.AWS_ACCESS_KEY_ID,
        'sessionKey': process.env.AWS_SECRET_ACCESS_KEY,
        'sessionToken': process.env.AWS_SESSION_TOKEN,
    })));

    await page.goto('https://signin.aws.amazon.com/federation?Action=login&Destination=https%3A%2F%2Fconsole.aws.amazon.com%2F&SigninToken=' + JSON.parse(signintoken)['SigninToken'], {
        timeout: 0,
        waitUntil: ['domcontentloaded']
    });

    await page.goto('https://console.aws.amazon.com/billing/home?#/bills', {
        timeout: 0,
        waitUntil: ['domcontentloaded']
    });
    
    const cookies = await page.cookies();

    cookie = "";
    cookies.forEach(cookieitem => {
        cookie += cookieitem['name'] + "=" + cookieitem['value'] + "; ";
    });
    cookie = cookie.substr(0, cookie.length - 2);

    xsrftoken = await page.$eval('#xsrfToken', element => element.value);
}

async function getCompleteBill(params) {
    if (!params.month.match(/^[0-9]+$/g) || !params.year.match(/^[0-9]+$/g)) {
        return {}
    }

    let res = await rp({
        uri: 'https://console.aws.amazon.com/billing/rest/v1.0/bill/completebill?month=' + params.month + '&year=' + params.year,
        headers: {
            'accept': 'application/json, text/plain, */*',
            'x-AWSBillingConsole-Region': 'us-east-1',
            'x-awsbc-xsrf-token': xsrftoken,
            'cookie': cookie
        }
    });

    return JSON.parse(res);
}

async function getInvoiceList(params) {
    if (!params.month.match(/^[0-9]+$/g) || !params.year.match(/^[0-9]+$/g)) {
        return {}
    }

    let res = await rp({
        uri: 'https://console.aws.amazon.com/billing/rest/v1.0/bill/invoice/list?month=' + params.month + '&year=' + params.year,
        headers: {
            'accept': 'application/json, text/plain, */*',
            'x-AWSBillingConsole-Region': 'us-east-1',
            'x-awsbc-xsrf-token': xsrftoken,
            'cookie': cookie
        }
    });

    return JSON.parse(res);
}

async function getLinkedAccountBillSummary(params) {
    if (!params.month.match(/^[0-9]+$/g) || !params.year.match(/^[0-9]+$/g)) {
        return {}
    }

    let res = await rp({
        uri: 'https://console.aws.amazon.com/billing/rest/v1.0/bill/linked/accountbillsummary?month=' + params.month + '&timestamp=' + Math.round(Date.now() / 1000).toString() + '&year=' + params.year,
        headers: {
            'accept': 'application/json, text/plain, */*',
            'x-AWSBillingConsole-Region': 'us-east-1',
            'x-awsbc-xsrf-token': xsrftoken,
            'cookie': cookie
        }
    });

    return JSON.parse(res);
}

exports.handler = async (event, context) => {
    LOG.debug(event);

    let resp = {
        "error": "No valid method called"
    }

    let browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
    });

    let page = await browser.newPage();

    await login(page);
    
    if (event.routeKey == "GET /completebill.json") {
        resp = await getCompleteBill(event.queryStringParameters);
    } else if (event.routeKey == "GET /invoicelist.json") {
        resp = await getInvoiceList(event.queryStringParameters);
    } else if (event.routeKey == "GET /linkedaccountbillsummary.json") {
        resp = await getLinkedAccountBillSummary(event.queryStringParameters);
    } else {
        return context.succeed();
    }
    
    return {
        "statusCode": 200,
        "isBase64Encoded": false,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify(resp)
    };
};

