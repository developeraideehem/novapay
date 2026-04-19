#!/bin/bash
# NovaPay Infrastructure Cleanup Script
# This script destroys the Kubernetes cluster via Kops and the AWS VPC via Terraform.

export CLUSTER_NAME="novaapay.site"
export KOPS_STATE_STORE="s3://novapay-kops-state-bucket" # Make sure this matches your Kops state bucket

echo "⚠️  WARNING: You are about to destroy the ENTIRE NovaPay infrastructure!"
echo "This will permanently delete the Kubernetes cluster, EC2 instances, EBS volumes, VPC, NAT Gateways, and Route53 records."
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "========================================================="
    echo "🚨 1. Deleting Kubernetes Cluster via Kops..."
    echo "========================================================="
    # Validate the cluster exists first
    kops get cluster --state=${KOPS_STATE_STORE} --name=${CLUSTER_NAME} > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        kops delete cluster --name=${CLUSTER_NAME} --state=${KOPS_STATE_STORE} --yes
        echo "✅ Kops cluster deletion initiated."
    else
        echo "⚠️  Kops cluster not found or already deleted. Skipping."
    fi

    echo "========================================================="
    echo "🚨 2. Destroying AWS Infrastructure via Terraform..."
    echo "========================================================="
    cd ../terraform || cd terraform || exit 1
    
    if [ -f "terraform.tfstate" ] || [ -d ".terraform" ]; then
        terraform destroy -auto-approve
        echo "✅ Terraform infrastructure destruction complete."
    else
        echo "⚠️  Terraform state not found. Execute manually if needed."
    fi

    echo "========================================================="
    echo "🗑️ Cleanup process completed."
    echo "Reminder: S3 buckets containing Terraform/Kops state files or DynamoDB lock tables are NOT automatically deleted by this script to preserve state history. Delete them manually from the AWS Console if you want a 100% account wipe."
    echo "========================================================="
else
    echo "Cleanup aborted."
    exit 1
fi
