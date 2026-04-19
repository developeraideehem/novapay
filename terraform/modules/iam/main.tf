# IAM Roles for Kops Cluster Nodes (Masters and Workers)
# Adhering to Least Privilege principles

resource "aws_iam_role" "masters" {
  name = "masters.${var.cluster_name}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role" "nodes" {
  name = "nodes.${var.cluster_name}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })
}

# Attach common policies for Kops
resource "aws_iam_role_policy_attachment" "masters_kops" {
  role       = aws_iam_role.masters.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2FullAccess" # Kops master needs substantial EC2 access
}

resource "aws_iam_role_policy_attachment" "nodes_standard" {
  role       = aws_iam_role.nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy" # Reusing standard node policy
}

resource "aws_iam_instance_profile" "masters" {
  name = "masters.${var.cluster_name}"
  role = aws_iam_role.masters.name
}

resource "aws_iam_instance_profile" "nodes" {
  name = "nodes.${var.cluster_name}"
  role = aws_iam_role.nodes.name
}
