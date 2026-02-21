secure_prompt() {
    local prompt="$1"
    local var_name="$2"
    local default_val="$3"
    local secret="$4"
    
    echo "$var_name=$default_val"
}

secure_prompt "Admin Password" "ADMIN_PASSWORD" "ZZjF9sk1SoL/7Dl6" "true"
