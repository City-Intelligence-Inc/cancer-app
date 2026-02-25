#!/usr/bin/env python3
import aws_cdk as cdk

from cancer_app_stack import CancerAppStack

app = cdk.App()
CancerAppStack(app, "CancerAppStack")
app.synth()
