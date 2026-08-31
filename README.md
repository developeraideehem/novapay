<p align="center">
  <h1>NovaPay — AWS Kubernetes FinTech Platform</h1>
</p>

<p align="center">
  <strong>Production-oriented cloud architecture for a modern digital wallet platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AWS-Cloud-orange?logo=amazon-aws" alt="AWS">
  <img src="https://img.shields.io/badge/Kubernetes-Orchestration-326CE5?logo=kubernetes" alt="Kubernetes">
  <img src="https://img.shields.io/badge/Terraform-Infrastructure%20as%20Code-7B42BC?logo=terraform" alt="Terraform">
  <img src="https://img.shields.io/badge/Docker-Containers-2496ED?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?logo=github-actions" alt="GitHub Actions">
  <img src="https://img.shields.io/badge/NGINX-Ingress-009639?logo=nginx" alt="NGINX">
</p>

DevOps portfolio project: NovaPay demonstrates how I design, provision, secure, and operate a containerized application environment on AWS using Infrastructure as Code, Kubernetes, CI automation, controlled networking, TLS, health checks, and autoscaling.

<h2>Executive Summary</h2>

NovaPay is an African digital-wallet and payments application with a web frontend and Node.js backend. The repository is intentionally structured to demonstrate the DevOps and cloud engineering lifecycle around the application—not only the application code itself.

The platform includes:

AWS infrastructure provisioned with Terraform

Kubernetes cluster provisioning using Kops

Containerized workloads with Docker

Kubernetes manifests organized with Kustomize

GitHub Actions CI workflows

NGINX Ingress for HTTP routing

Automated TLS certificates through cert-manager and Let's Encrypt

Kubernetes NetworkPolicy controls

Horizontal Pod Autoscaling

Application health checks and resource requests/limits

Operational documentation and cleanup automation

The architecture is designed to emphasize repeatability, security, availability, and operational discipline.

<h2>Architecture at a Glance</h2>

flowchart TB
    U[Users / Clients]
    DNS[DNS / Domain]
    ING[NGINX Ingress]
    TLS[TLS / Let's Encrypt]

    subgraph AWS["AWS"]
        subgraph VPC["VPC 10.0.0.0/16"]
            PUB[Public Subnets]
            PRIV[Private Subnets]

            subgraph K8S["Kubernetes Cluster"]
                WEB[Frontend Service]
                API[Backend Service]
                HPA[Horizontal Pod Autoscaler]
                NP[NetworkPolicy]
            end

            NAT[NAT Gateway]
        end

        ECR[Amazon ECR]
        S3[S3 Kops State]
    end

    DB[(Supabase / PostgreSQL)]
    PAY[Paystack API]

    U --> DNS --> ING --> TLS
    TLS --> WEB
    TLS --> API
    WEB --> API
    API --> DB
    API --> PAY

    PUB --> ING
    PRIV --> K8S
    PRIV --> NAT
    K8S --> ECR
    K8S --> S3
    HPA -.scales.-> API
    NP -.controls.-> API

Note: The repository's Terraform configuration currently uses a single NAT Gateway to reduce cost, while the architecture documentation describes a redundant one-per-AZ design. The implementation and documentation should be kept aligned before treating the environment as a final reference architecture.

<h2>Engineering Goals</h2>

1. Repeatable infrastructure

Cloud infrastructure should be reproducible rather than manually assembled.

Terraform is used to define the AWS network and supporting infrastructure as code, allowing changes to be version-controlled and reviewed.

2. Containerized application delivery

The application is packaged into containers so that the runtime environment is consistent across development and deployment workflows.

3. Kubernetes-based orchestration

Kubernetes provides service discovery, deployment management, rolling updates, health checks, and horizontal scaling.

4. Secure-by-design traffic controls

The deployment separates public and private networking, uses Kubernetes NetworkPolicies, restricts application traffic, and terminates HTTPS through the ingress layer.

5. Automation

GitHub Actions provides automated CI checks for the web application and database migration files, reducing manual validation before changes are integrated.

<h2>DevOps Implementation</h2>

1. Infrastructure as Code — Terraform

The terraform/ directory contains the AWS infrastructure definition.

The network design includes:

VPC with CIDR 10.0.0.0/16

Three Availability Zones

Three public subnets

Three private subnets

NAT Gateway for private-subnet outbound connectivity

Security and IAM configuration

Environment-driven variables and outputs

The Terraform configuration uses the community AWS VPC module and separates infrastructure concerns into reusable configuration.

Why it matters: infrastructure can be reviewed, versioned, reproduced, and changed through controlled code rather than manual console configuration.

2. Kubernetes Cluster Provisioning — Kops

The kops/ directory contains the cluster provisioning workflow.

The cluster script configures:

AWS as the target cloud provider

Private cluster topology

Calico networking

Multi-AZ placement

Public API load balancer

S3-backed Kops state

The current script provisions a cluster definition using one master and one worker node per its present configuration. This is intentionally documented here so the repository accurately reflects the code rather than overstating the deployed topology.

3. Kubernetes Workloads

The k8s/base/ directory contains Kubernetes resources managed as a deployment base.

It includes:

Namespace

Frontend Deployment / Service

Backend Deployment / Service

Ingress

HorizontalPodAutoscaler

NetworkPolicy

TLS/issuer resources

Kustomize configuration

Backend deployment

The backend is configured with:

2 replicas

RollingUpdate strategy

maxUnavailable: 0

maxSurge: 1

non-root container execution

CPU and memory requests/limits

readiness probe

liveness probe

Kubernetes Service abstraction

These settings are intended to support safer releases and better runtime behavior.

4. Health Checks & Self-Healing

The backend exposes a /health endpoint used by Kubernetes for both readiness and liveness checks.

This allows Kubernetes to distinguish between:

a container that has started but is not ready to receive traffic

a healthy application instance

an unhealthy instance that should be restarted

Health checks are an important part of operating applications reliably in a containerized environment.

5. Autoscaling

The backend has a Kubernetes HorizontalPodAutoscaler configured using CPU and memory utilization targets.

Current settings:

Setting

Value

Minimum replicas

2

Maximum replicas

10

CPU target

70%

Memory target

80%

This provides a foundation for automatically increasing or reducing backend capacity as resource consumption changes.

6. Ingress, TLS & Routing

NovaPay uses NGINX Ingress for external HTTP routing.

The current configuration includes:

novaapay.site → frontend service

api.novaapay.site → backend service

HTTPS enforcement

cert-manager integration

Let's Encrypt certificate management

basic request-rate limiting

This demonstrates a common Kubernetes edge-routing pattern where traffic is terminated and routed centrally at the ingress layer.

7. Kubernetes Network Policies

The backend namespace includes a NetworkPolicy restricting allowed traffic.

Inbound traffic is limited to expected sources, including:

frontend workloads

ingress-nginx

The policy also defines outbound access for required external services using standard DNS/HTTP/HTTPS ports.

This provides an additional network-control layer inside the cluster beyond AWS-level security controls.

8. CI Automation — GitHub Actions

The repository includes a GitHub Actions workflow that runs on pushes to the main development branches and on pull requests.

The current workflow includes checks for the web application such as:

Repository checkout

Node.js 20 setup

Dependency installation using npm ci

TypeScript checking

ESLint

Production build

Build artifact upload

The workflow also validates that Supabase SQL migration files exist and are non-empty.

Secrets such as Supabase and payment-provider public configuration are supplied through GitHub Actions secrets rather than committed directly into source control.

Technology Stack

Area

Technology

Cloud

AWS

Infrastructure as Code

Terraform

Cluster Provisioning

Kops

Containerization

Docker

Orchestration

Kubernetes

Manifest Management

Kustomize

CI

GitHub Actions

Ingress

NGINX Ingress

TLS

cert-manager + Let's Encrypt

Networking

AWS VPC + Kubernetes NetworkPolicy

Application Backend

Node.js / Express

Web Frontend

React / Vite

Data

PostgreSQL / Supabase

Payment Integration

Paystack

Scripting

Bash / Shell

<h2>Repository Structure</h2>

novapay/
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── backend/
│   └── Node.js / Express API
│
├── docs/
│   ├── architecture.md
│   ├── runbook.md
│   └── cost-analysis.md
│
├── k8s/
│   └── base/
│       ├── backend.yaml
│       ├── web.yaml
│       ├── ingress.yaml
│       ├── hpa.yaml
│       ├── network-policy.yaml
│       └── kustomization.yaml
│
├── kops/
│   └── create-cluster.sh
│
├── scripts/
│   └── destroy.sh
│
├── supabase/
│   └── migrations/
│
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── providers.tf
│
├── web/
│   └── React / Vite application
│
├── docker-compose.yml
└── README.md

<h2>Local Development</h2>

Clone the repository:

git clone https://github.com/developeraideehem/novapay.git
cd novapay

Start the local environment:

docker compose up --build

Stop the environment:

docker compose down

AWS Deployment Workflow

At a high level, the infrastructure workflow is:

Terraform
   ↓
AWS VPC / Networking
   ↓
Terraform Outputs
   ↓
Kops Cluster Provisioning
   ↓
Kubernetes Configuration
   ↓
Docker Images
   ↓
Kubernetes Deployments
   ↓
NGINX Ingress + TLS
   ↓
Application

Refer to the operational runbook in docs/ for environment-specific deployment procedures.

<h2>Security Considerations</h2>

This project demonstrates several security-oriented practices:

Private subnets for workload nodes

AWS IAM configuration

Kubernetes NetworkPolicies

Non-root backend container execution

Secrets injected through Kubernetes Secret references

HTTPS enforcement

Automated TLS certificates

Basic ingress request-rate limiting

Separation of application configuration from secrets

Version-controlled infrastructure

Important: This repository is a portfolio/reference project. It should not be interpreted as a production financial system or as evidence of regulatory compliance, PCI DSS certification, or production payment-processing volume.

Operational Considerations

For a real production deployment, I would extend the current implementation with additional controls such as:

centralized observability and alerting

managed Kubernetes where appropriate

external secrets / cloud secret management

image vulnerability scanning

Terraform state hardening

policy-as-code

automated security scanning in CI

managed database strategy

backup and disaster-recovery validation

multi-region disaster recovery where justified

progressive delivery / canary releases

cost monitoring and budget alerts

These are natural next steps rather than claims about functionality already implemented in this repository.

What This Project Demonstrates

NovaPay is designed to demonstrate practical capability in:

Cloud Infrastructure

AWS networking

VPC design

public/private subnetting

IAM

cloud resource provisioning

DevOps

Infrastructure as Code

containerization

Kubernetes

CI automation

deployment workflows

operational scripting

Platform Engineering

service exposure

ingress routing

health checks

autoscaling

workload policies

environment configuration

Cloud Security

network segmentation

least-privilege-oriented access

non-root containers

secret injection

TLS

network policy enforcement

Why NovaPay Matters

The goal of this project is not simply to demonstrate knowledge of individual DevOps tools.

It demonstrates how the tools work together as an engineering system:

Code → Infrastructure → Containers → Kubernetes → CI → Secure Networking → Traffic Management → Scaling → Operations

That end-to-end perspective is the core of modern DevOps and cloud engineering.

Portfolio Highlight

Role: DevOps & Cloud Engineer
Project: NovaPay
Focus: AWS • Kubernetes • Terraform • Docker • GitHub Actions • NGINX • Cloud Networking • Security

Selected engineering outcomes

Infrastructure defined as code

Containerized application delivery

Kubernetes workload management

Automated CI validation

HTTPS ingress with certificate automation

Health-based workload management

CPU/memory autoscaling

Kubernetes network controls

Operational runbook and cleanup automation

Links

Repository: https://github.com/developeraideehem/novapay

Architecture: docs/architecture.md

Operational Runbook: docs/runbook.md

Cost Analysis: docs/cost-analysis.md

<h2>Disclaimer</h2>

NovaPay is a portfolio and engineering demonstration project. Architecture choices are intended to show practical DevOps patterns and trade-offs. Payment integrations, infrastructure sizing, security controls, monitoring, resilience, and compliance requirements would require additional validation before use in a real financial production environment.

<p align="center">
  <strong>Built to demonstrate cloud engineering, automation, and reliable application delivery.</strong>
</p>
