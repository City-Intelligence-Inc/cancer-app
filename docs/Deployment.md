# Deployment

## Backend (Docker → ECR → App Runner)

```bash
cd backend
docker build --platform linux/amd64 -t cancer-app-backend .
ECR=050451400186.dkr.ecr.us-east-1.amazonaws.com/cancer-app-backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 050451400186.dkr.ecr.us-east-1.amazonaws.com
docker tag cancer-app-backend:latest $ECR:latest
docker push $ECR:latest
aws apprunner start-deployment \
  --service-arn "arn:aws:apprunner:us-east-1:050451400186:service/cancer-app-backend/185367acf06345f1b9fd2d6a3501c90b" \
  --region us-east-1
```

Deployment takes ~2 minutes. Poll status:
```bash
aws apprunner describe-service \
  --service-arn "arn:aws:apprunner:us-east-1:050451400186:service/cancer-app-backend/185367acf06345f1b9fd2d6a3501c90b" \
  --region us-east-1 \
  --query "Service.Status" --output text
```

## Web (Vercel)

```bash
cd web && npx vercel --prod --yes
```

## iOS (EAS → TestFlight)

```bash
cd frontend
eas build --profile production --platform ios --non-interactive
# After build completes:
eas submit --profile production --platform ios
```

> Note: Free tier builds queue. Check status at https://expo.dev

## Infrastructure (CDK)

```bash
cd infra && cdk deploy --require-approval never
```

## Post-Deploy: Sync Resources

After backend deploys, sync sheet data to DynamoDB:
```bash
curl -X POST https://iutm2kyhqq.us-east-1.awsapprunner.com/sync-resources
```

Or use the "Sync Now" button on the `/admin` page.
