#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ContentstackIntegrationEnvStack } from "../lib/cs-demo-env-stack";
import { PermissionsBoundary } from "../lib/premission-boundary";

const app = new cdk.App();
const deployStack =new ContentstackIntegrationEnvStack(app, 'Contentstack-Env-Stack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '837642108960', region: 'eu-north-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// for deployment to EPAM accounts only
cdk.Aspects.of(deployStack).add(
  new PermissionsBoundary('arn:aws:iam::863151058727:policy/eo_role_boundary'),
);

// cdk.Tags.of(deployStack).add('contentstack-demo', '' );


// Add tags to all constructs in the stack
cdk.Tags.of(deployStack).add('stage', "demo");
cdk.Tags.of(deployStack).add('mach-cc:stage', "demo");
cdk.Tags.of(deployStack).add('stack', deployStack.stackName);
