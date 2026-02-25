from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    RemovalPolicy,
    aws_dynamodb as dynamodb,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_apprunner as apprunner,
)


class CancerAppStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ECR Repository
        repo = ecr.Repository(
            self,
            "BackendRepo",
            repository_name="cancer-app-backend",
            removal_policy=RemovalPolicy.DESTROY,
            empty_on_delete=True,
        )

        # DynamoDB Table
        table = dynamodb.Table(
            self,
            "SessionsTable",
            table_name="Sessions",
            partition_key=dynamodb.Attribute(
                name="sessionId", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="createdAt", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            time_to_live_attribute="expiresAt",
        )

        # IAM role for App Runner to pull from ECR
        access_role = iam.Role(
            self,
            "AppRunnerAccessRole",
            assumed_by=iam.ServicePrincipal("build.apprunner.amazonaws.com"),
        )
        repo.grant_pull(access_role)

        # IAM instance role for the running container
        instance_role = iam.Role(
            self,
            "AppRunnerInstanceRole",
            assumed_by=iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
        )
        table.grant_read_write_data(instance_role)

        # App Runner Service
        service = apprunner.CfnService(
            self,
            "BackendService",
            service_name="cancer-app-backend",
            source_configuration=apprunner.CfnService.SourceConfigurationProperty(
                authentication_configuration=apprunner.CfnService.AuthenticationConfigurationProperty(
                    access_role_arn=access_role.role_arn,
                ),
                image_repository=apprunner.CfnService.ImageRepositoryProperty(
                    image_identifier=f"{repo.repository_uri}:latest",
                    image_repository_type="ECR",
                    image_configuration=apprunner.CfnService.ImageConfigurationProperty(
                        port="8080",
                        runtime_environment_variables=[
                            apprunner.CfnService.KeyValuePairProperty(
                                name="TABLE_NAME",
                                value=table.table_name,
                            ),
                        ],
                    ),
                ),
            ),
            instance_configuration=apprunner.CfnService.InstanceConfigurationProperty(
                instance_role_arn=instance_role.role_arn,
                cpu="256",
                memory="512",
            ),
            health_check_configuration=apprunner.CfnService.HealthCheckConfigurationProperty(
                protocol="HTTP",
                path="/health",
            ),
        )

        # Outputs
        cdk.CfnOutput(self, "ServiceUrl", value=f"https://{service.attr_service_url}")
        cdk.CfnOutput(self, "EcrRepoUri", value=repo.repository_uri)
        cdk.CfnOutput(self, "TableName", value=table.table_name)
