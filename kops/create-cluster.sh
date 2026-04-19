#!/bin/bash
# High Availability Kubernetes Cluster Provisioning via Kops

export NAME="novaapay.site"
export KOPS_STATE_STORE="s3://novapay-kops-state-bucket"

# NOTE: You MUST extract these variables from `terraform output` after running terraform apply.
# Example: export VPC_ID=$(terraform output -raw vpc_id)
#          export SUBNET_IDS=$(terraform output -raw private_subnets)

if [ -z "$VPC_ID" ]; then
  echo "Error: VPC_ID environment variable is missing. Run terraform apply first and export the outputs."
  exit 1
fi

echo "Creating Kops Cluster: $NAME"
echo "Topology: Private"
echo "Networking: Calico (supports NetworkPolicy)"

kops create cluster \
  --name=${NAME} \
  --state=${KOPS_STATE_STORE} \
  --cloud=aws \
  --vpc=${VPC_ID} \
  --zones=us-east-1a,us-east-1b,us-east-1c \
  --master-zones=us-east-1a \
  --master-count=1 \
  --master-size=t3.small \
  --node-count=1 \
  --node-size=t3.small \
  --topology=private \
  --networking=calico \
  --api-loadbalancer-type=public \
  --yes

echo "Cluster definition created and apply initiated."
echo "Wait a few minutes, then run: kops validate cluster --wait 10m"
