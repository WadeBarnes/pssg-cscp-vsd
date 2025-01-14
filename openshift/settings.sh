# bash script to be sourced to set environment variables for OpenShift scripts
export PROJECT_NAMESPACE="pssg-cscp-vsd"
export PROJECT_OS_DIR=${PROJECT_OS_DIR:-../../openshift}

# The templates that should not have their GIT referances(uri and ref) over-ridden
# Templates NOT in this list will have they GIT referances over-ridden
# with the values of GIT_URI and GIT_REF
export skip_git_overrides=""
export GIT_URI="https://github.com/WillWeinzettl/pssg-cscp-vsd.git"
export GIT_REF="development"

# The project components
# - defaults to the support the Simple Project Structure
export components=${components:-"vsd-app"}

# The builds to be triggered after buildconfigs created (not auto-triggered)
export builds=${builds:-""}

# The images to be tagged after build
export images=${images:-"vsd-app"}

# The routes for the project
export routes=${routes:-""}
