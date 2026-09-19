variable "aws_region" {
  default = "us-west-1"
}

variable "instance_type" {
  description = "Compute-optimized c7i-flex instance type"
  default     = "c7i-flex.large" 
}
