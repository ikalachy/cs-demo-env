# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Steps
1. create a secret with AWS SecretsManageer 
 e.g **cs-demo-prod-contentstack**
2. npm install
3. cdk bootstrap


 **Comment out in case you don't use permission boundaries**
```
// for deployment to EPAM accounts only
cdk.Aspects.of(deployStack).add(
  new PermissionsBoundary('arn:aws:iam::863151058727:policy/eo_role_boundary'),
);
```

4. STAGE=prod && cdk deploy



## Useful commands


* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
