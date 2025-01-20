# Folks Hosting Infrastructure

The production app will be hosted on a DigitalOcean Droplet in New York behind Cloudflare, it will use AWS in the us-east-1 region for S3 and SES for sending emails.

A thing that will need attention are the image and video processing pipelines, as well as scanning for NSFW content.

## AWS Policy

(Remember to replace the bucket name "folks-media" with your own.)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::folks-media/*"
    },
    {
      "Sid": "VisualEditor1",
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```
