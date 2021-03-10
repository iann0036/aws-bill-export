# AWS Bill Export

> ["something monstrous"](https://twitter.com/QuinnyPig/status/1251572159434027008)

Downloads AWS bills from the console programmatically.

## Installation

[![Launch Stack](https://cdn.rawgit.com/buildkite/cloudformation-launch-stack-button-svg/master/launch-stack.svg)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=billretriever&templateURL=https://s3.amazonaws.com/ianmckay-us-east-1/billretriever/template.yml)

Click the above link to deploy the stack to your environment.

If you prefer, you can also manually upsert the [template.yml](https://github.com/iann0036/aws-bill-export/blob/master/template.yml) stack from source.

Currently, the only tested region is `us-east-1`.

## Usage

The stack outputs a base URL you can use to make calls. The following calls can be made:

**Show complete bill contents**

```
https://<baseurl>/completebill.json?month=3&year=2020
```

**Show the invoice list**

```
https://<baseurl>/invoicelist.json?month=3&year=2020
```

**Show linked account bills**

```
https://<baseurl>/linkedaccountbillsummary.json?month=3&year=2020
```

## Notes

Authentication and/or authorization is anonymous by default. This is left as an exercise for you.
