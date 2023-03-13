import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function } from 'aws-cdk-lib/aws-lambda';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import {
  LambdaIntegration,
  RestApi,
  EndpointType,
  Cors,
  Deployment,
  Stage,
} from 'aws-cdk-lib/aws-apigateway';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class ContentstackIntegrationEnvStack extends Stack {
  private integrationApiLambda: Function;
  private integrationApi: RestApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.createIntegrationLambda('dev');
    this.createIntegrationApi('dev');

    this.createIntegrationLambda('prod');
    this.createIntegrationApi('prod');


  }

  private createIntegrationLambda = (stage: string) => {
    // TODO: we should provide here only secret names and read them on runtime
    const csApiTokens = secretsmanager.Secret.fromSecretNameV2(
      this,
      `cs-api-keys-${stage}`,
      `cs-demo-${stage}-contentstack`,
    );

    this.integrationApiLambda = new cdk.aws_lambda.Function(
      this,
      `Contentstack-Integration-Lambda-${stage}`,
      {
        code: cdk.aws_lambda.Code.fromAsset('./lambda'),
        handler: 'index.handler',
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        environment: {
          CONTENTSTACK_API_KEY: csApiTokens
            .secretValueFromJson('CONTENTSTACK_API_KEY')
            .unsafeUnwrap(),
          CONTENTSTACK_DELIVERY_TOKEN: csApiTokens
            .secretValueFromJson('CONTENTSTACK_DELIVERY_TOKEN')
            .unsafeUnwrap(),
          CONTENTSTACK_MANAGEMENT_TOKEN: csApiTokens
            .secretValueFromJson('CONTENTSTACK_MANAGEMENT_TOKEN')
            .unsafeUnwrap(),
          CONTENTSTACK_AUTOMATIONS_API_KEY: csApiTokens
            .secretValueFromJson('CONTENTSTACK_AUTOMATIONS_API_KEY')
            .unsafeUnwrap(),
          CONTENTSTACK_AUTOMATIONS_UID: csApiTokens
            .secretValueFromJson('CONTENTSTACK_AUTOMATIONS_UID')
            .unsafeUnwrap(),

          CONTENTSTACK_API_HOST: 'api.contentstack.io',
          CONTENTSTACK_APP_HOST: 'app.contentstack.com',
        },
      },
    );
  };

  /*
      API Gateway integration
    */
  private createIntegrationApi = (stage: string) => {
    // const api = new apigw.RestApi(this, 'my_api', { deploy: false });
    this.integrationApi = new RestApi(this, `Contentstack-API-${stage}`, {
      description: `Contentstack Integration API for ${stage}`,
      // deployOptions: {
      //   // stageName: 'v3',
      //   deploy: false,
      // },
      endpointConfiguration: { types: [EndpointType.EDGE] },
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowMethods: Cors.ALL_METHODS,
        allowCredentials: true,
        allowOrigins: Cors.ALL_ORIGINS,
      },
      deploy: false,
      binaryMediaTypes: ['multipart/form-data'],
    });

    // Then create an explicit Deployment construct
    const deployment = new Deployment(this, `IntegrationDeployment-${stage}`, { api: this.integrationApi });

    // And different stages
    const [apiStage, appStage] = ['v3', 'automations-api'].map(
      (item) => new Stage(this, `${item}`, { deployment, stageName: item }),
    );

    this.integrationApi.deploymentStage = apiStage;

    new cdk.CfnOutput(this, 'apiUrl', { value: this.integrationApi.url });

    // appStage is not among allowed
    this.integrationApiLambda.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'));

    this.addProxyApiResources();
  };

  private addProxyApiResources = () => {
    const anyProxy = this.integrationApi.root.addProxy({
      anyMethod: true,
      defaultIntegration: new LambdaIntegration(this.integrationApiLambda),
    });
  };
}
