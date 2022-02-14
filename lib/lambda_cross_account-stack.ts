import { 
  aws_codecommit as codecommit, 
  aws_codepipeline as codepipeline, 
  aws_codepipeline_actions as codepipeline_actions,
  aws_iam as iam,
  aws_lambda as lambda,
  Stack, 
  StackProps, 
} from 'aws-cdk-lib';
import { Effect } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class LambdaCrossAccountStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const repo = new codecommit.Repository(this, "repo",{
      repositoryName: "LambdaCrossAccount"
    })

    const sourceOutput = new codepipeline.Artifact();

    const crossAccountRoleARN = "arn:aws:iam::012345678912:role/SOME_ROLE_ARN_FROM_OTHER_ACCOUNT"
    const pipeline = new codepipeline.Pipeline(this,"Pipeline", {
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit_Source',
              repository: repo,
              output: sourceOutput,
              branch: 'baseline'
            }),
          ],
        },
        {
          stageName: 'Lambda',
          actions: [
            new codepipeline_actions.LambdaInvokeAction({
              actionName: "Execute_Lambda",
              lambda: lambda.Function.fromFunctionArn(this,"lambdaReference",'arn:aws:lambda:us-east-1:012345678912:function:SOME_LAMBDA_ARN_FROM_OTHER_ACCOUNT'),
              role: iam.Role.fromRoleArn(this,"roleReference",crossAccountRoleARN)
            })
          ]
        }
      ]}
    )

    const allowPolicy = new iam.Policy(this, 'AssumeRole', {
      statements: [
        new iam.PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['sts:AssumeRole'],
          resources: [crossAccountRoleARN],
        })]})
 
    
    pipeline.role.attachInlinePolicy(allowPolicy)

    
    
    

  }
}
