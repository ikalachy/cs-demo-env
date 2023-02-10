import * as cdk from "aws-cdk-lib";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Function } from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import {
  LambdaIntegration,
  RestApi,
  EndpointType
} from "aws-cdk-lib/aws-apigateway";

export class ContentstackIntegrationEnvStack extends Stack {
  private integrationApiLambda: Function;
  private integrationApi: RestApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.createIntegrationLambda();
    this.createIntegrationApi();
  }

  private createIntegrationLambda = () => {
    // TODO: we should provide here only secret names and read them on runtime
    const csApiTokens = secretsmanager.Secret.fromSecretNameV2(
      this,
      "cs-api-keys",
      "dev/cs-demo/contentstack"
    );

    this.integrationApiLambda = new cdk.aws_lambda.Function(
      this,
      "Contentstack-Integration-Lambda",
      {
        code: cdk.aws_lambda.Code.fromAsset("lambda/index.js"),
        handler: "index.handler",
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        environment: {
          CONTENTSTACK_API_KEY: csApiTokens
            .secretValueFromJson("CONTENTSTACK_API_KEY")
            .unsafeUnwrap(),
          CONTENTSTACK_DELIVERY_TOKEN: csApiTokens
            .secretValueFromJson("CONTENTSTACK_DELIVERY_TOKEN")
            .unsafeUnwrap(),
          CONTENTSTACK_ENVIRONMENT: "development",

          CONTENTSTACK_API_HOST: "api.contentstack.io",
          CONTENTSTACK_APP_HOST: "app.contentstack.com"
          // REACT_APP_CONTENTSTACK_MANAGEMENT_TOKEN = your_management_token
        }
      }
    );
  };
  /*
      API Gateway integration
    */
  private createIntegrationApi = () => {
    this.integrationApi = new RestApi(this, "Contentstack-API", {
      description: "Contentstack Integration API",
      deployOptions: {
        stageName: "v3"
      },
      endpointConfiguration: { types: [EndpointType.REGIONAL] },
      defaultCorsPreflightOptions: {
        allowHeaders: ["*"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"]
      }
    });
    new cdk.CfnOutput(this, "apiUrl", { value: this.integrationApi.url });

    this.addProxyApiResources();
  };

  private addProxyApiResources = () => {
    const anyProxy = this.integrationApi.root.addProxy({
      anyMethod: true,
      defaultIntegration: new LambdaIntegration(this.integrationApiLambda)
    });
  };
}
