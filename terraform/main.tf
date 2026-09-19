provider "aws" {
  region = var.aws_region
}

# Dynamically fetch the official Ubuntu 22.04 LTS AMI for us-west-1
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical's official AWS account ID
}

# 1. Custom VPC
resource "aws_vpc" "cloudcart_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "cloudcart-vpc-us-west-1" }
} # <--- FIXED: Added missing closing brace here

# 2. Internet Gateway
resource "aws_internet_gateway" "cloudcart_igw" {
  vpc_id = aws_vpc.cloudcart_vpc.id
  tags   = { Name = "cloudcart-igw" }
}

# 3. Public Subnet
resource "aws_subnet" "cloudcart_subnet" {
  vpc_id                  = aws_vpc.cloudcart_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  tags                    = { Name = "cloudcart-subnet" }
}

# 4. Route Table & Association
resource "aws_route_table" "cloudcart_rt" {
  vpc_id = aws_vpc.cloudcart_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.cloudcart_igw.id
  }
  tags = { Name = "cloudcart-rt" }
}

resource "aws_route_table_association" "cloudcart_rta" {
  subnet_id      = aws_subnet.cloudcart_subnet.id
  route_table_id = aws_route_table.cloudcart_rt.id
}

# 5. Security Group (Required for Kubeadm & App Traffic)
resource "aws_security_group" "cloudcart_sg" {
  name        = "cloudcart-c7i-k8s-sg"
  description = "Allow SSH, Kubernetes API, NodePorts, and internal VPC traffic"
  vpc_id      = aws_vpc.cloudcart_vpc.id

  # SSH Access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kubernetes API Server
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # NodePort Services Range (For microservices external access)
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Internal VPC Communication (Vital for node-to-node cluster networking)
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
  }

  # Outbound Internet Access
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "cloudcart-c7i-sg" }
}

# 6. EC2 Instances (3 x c7i.large: 1 Master Node, 2 Worker Nodes)
resource "aws_instance" "master_node" {
  ami                    = data.aws_ami.ubuntu.id # <--- FIXED: Using dynamic data source
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.cloudcart_subnet.id
  vpc_security_group_ids = [aws_security_group.cloudcart_sg.id]
  key_name               = "cloudcart-us-west-1-key"

  tags = {
    Name = "cloudcart-c7i-master"
  }
}

resource "aws_instance" "worker_nodes" {
  count                  = 2
  ami                    = data.aws_ami.ubuntu.id # <--- FIXED: Using dynamic data source
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.cloudcart_subnet.id
  vpc_security_group_ids = [aws_security_group.cloudcart_sg.id]
  key_name               = "cloudcart-us-west-1-key"

  tags = {
    Name = "cloudcart-c7i-worker-${count.index + 1}"
  }
}
