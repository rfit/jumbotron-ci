# JumboTRON - CI

[![CircleCI](https://circleci.com/gh/rfit/jumbotron-ci.svg?style=shield)](https://circleci.com/gh/rfit/jumbotron-ci)

Run:
```BASH
$ node start <module> <command> [args] <target-environment>
```

# AWS Setup
* [AWS Console](https://rfit.signin.aws.amazon.com/console)
* Region: Frankfurt (eu-central-1)

#### 1. Create IAM policy
Create a `JumbotronPolicy` with the following [access policy as JSON](#access-policy).

#### 2. Create IAM user
Create a `jumbotron` user with programmatic access for the backend + CI/CD and attatch the policy created.

#### 3. Create IAM role
Create an `AWS Service Role` for `AWS Lambda` named `JumbotronLambdaRole` and attach the policy created.

#### 4. Create S3 bucket
Create a `rfjumbotron` bucket without properties and any permissions.

**TODO**: Bucket policy and CORS

#### 5. Create SQS queues
Create queues for the three environments
* `development`
* `staging`
* `production`

##### JumbotronFileAddedResults
Create new queue
* Name: `JumbotronFileAddedResults-<environment`
* Visibility timeout: 60 sec
* Message retention period: Maximum (14 days)
* Receive Message Wait Time: Maximum (20 sec) (for long polling)

##### JumbotronMediaProcessingResults
Create new queue
* Name: `JumbotronMediaProcessingResults-<environment`
* Visibility timeout: 60 sec
* Message retention period: Maximum (14 days)
* Receive Message Wait Time: Maximum (20 sec) (for long polling)

#### 6. Create Lambda functions
Create functions for the three environments
* `development`
* `staging`
* `production`

##### JumbotronFileAdded recipe:
* Create blank function
* Add S3 trigger
  * Bucket: The bucket created
  * Event type: `Object Created`
  * Prefix: `<environment>/uploads`
* Name: `JumbotronFileAdded-<environment>`
* Runtime: Node 8.10
* ENV:
  * `TARGET_ENV`: `<environment>`
	* `QUEUE_URL`: URL for matching queue and environment
* Role: The role created
* Timeout: Maximum (5 min)

##### JumbotronMediaProcessing recipe:
* Create blank function
* No trigger
* Name: `JumbotronMediaProcessing-<environment>`
* Runtime: Node 8.10
* ENV:
  * `TARGET_ENV`: `<environment>`
  * `QUEUE_URL`: URL for matching queue and environment
* Role: The role created
* Memory: Maximum (1536 MB)
* Timeout: Maximum (5 min)

### Access policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3",
            "Effect": "Allow",
            "Action": [
                "s3:DeleteObject",
                "s3:GetObject",
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::rfjumbotron/*"
            ]
        },
        {
            "Sid": "CloudWatchLogs",
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "arn:aws:logs:*:*:*"
            ]
        },
        {
            "Sid": "Lambda",
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction",
                "lambda:UpdateFunctionCode"
            ],
            "Resource": [
                "arn:aws:lambda:*:*:function:Jumbotron*"
            ]
        },
        {
            "Sid": "SQS",
            "Effect": "Allow",
            "Action": [
                "sqs:DeleteMessage",
                "sqs:ReceiveMessage",
                "sqs:SendMessage"
            ],
            "Resource": [
                "arn:aws:sqs:*:*:*"
            ]
        }
    ]
}
```
