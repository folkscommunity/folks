# Folks Hosting Infrastructure

The production app will be hosted on a DigitalOcean Droplet in New York behind Cloudflare, it will use AWS in the us-east-1 region for S3 and SES for sending emails.

A thing that will need attention are the image and video processing pipelines, as well as scanning for NSFW content.
