# Automating Infrastructure Setup and Teardown for Different Environments

## Introduction

Curiosity is a vital trait of a software engineer. It allows us to explore new technologies and deepen our understanding of concepts that can take our abilities to the next level. This report dives into the automation of infrastructure setup and teardown for different environments, such as development (dev), production (prod), and staging, using Infrastructure as Code (IaC) principles and AWS CloudFormation.

The inspiration for this topic came from my work on a serverless API service using API Gateway and Lambda functions. I wanted to design a pipeline that automatically sets up a dev environment when a new branch is created in GitHub and deploys it to prod when the code is merged into the main branch. This report outlines the process, challenges, and solutions I discovered.

## The Goal

To create a robust pipeline that:

-   Deploys a dev environment (API Gateway and Lambda function) for every new branch.
-   Automatically updates the dev environment as code changes are pushed.
-   Tears down the dev environment when the branch is merged into prod.
-   Deploys the updated code to the prod environment.

The resources must be tagged uniquely (e.g., `dev-<branch-name>`) to manage multiple dev environments simultaneously.

## Learning Journey

### Initial Attempts

We were introduced to IaC and AWS CloudFormation in class, but the templates were provided. I started by attempting to copy the class code and modify it. However, the examples didn’t include configurations for API Gateway or Lambda functions. Google searches yielded outdated examples (mostly for API Gateway v1), which didn’t work as expected. Linking API Gateway v2 to Lambda was particularly challenging due to the additional configuration required.

### Exploring AWS Documentation

I turned to AWS’s official CloudFormation documentation. The "Template Reference" section, particularly the "Resource and Property Reference," provided:

-   Examples for every AWS resource.
-   Detailed explanations of required and optional properties.
-   Sample values for properties.

This helped me construct a CloudFormation template, but I still struggled to connect API Gateway v2 to the Lambda function.

### AWS Infrastructure Composer

To simplify visualization and configuration, I experimented with AWS Infrastructure Composer, a drag-and-drop tool for creating and managing AWS resources. While it made configuring individual resources easier, I continued to face difficulties linking API Gateway to Lambda.

### The Breakthrough

After extensive research, I discovered a feature that allows exporting existing Lambda and API Gateway configurations to Infrastructure Composer. This process:

1. Exports a working Lambda configuration and its API Gateway links.
2. Generates a YAML template that includes the correct configuration for linking.
3. Simplifies the creation of new environments by using the exported template.

### Implementation

Using the exported template as a base, I:

1. Modified the YAML file to include unique tags for dev environments (`dev-<branch-name>`).
2. Integrated the template into a CI/CD pipeline using GitHub Actions.
3. Automated the following steps:
    - Deploy a dev environment when a branch is created.
    - Update the dev environment when changes are pushed.
    - Tear down the dev environment and deploy to prod when the branch is merged.

This setup ensures a seamless and foolproof deployment process.

## Conclusion

Automating infrastructure setup and teardown for multiple environments using CloudFormation and AWS tools has been an enlightening journey. Understanding how to link resources like API Gateway and Lambda through Infrastructure Composer and YAML templates has empowered me to design a robust pipeline for serverless applications.

This exploration not only enhanced my knowledge of IaC but also equipped me with practical skills to simplify deployment processes, making them more efficient and reliable.
