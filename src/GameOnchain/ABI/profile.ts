import { MODULE_ADDRESS } from "../movement_service/constants";

export const ABI = {
    "address": MODULE_ADDRESS,
    "name": "profile",
    "friends": [],
    "exposed_functions": [
        {
            "name": "create_profile",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": [
                "&signer",
                "0x1::string::String",
                "0x1::string::String"
            ],
            "return": []
        },
        {
            "name": "get_address_by_username",
            "visibility": "public",
            "is_entry": false,
            "is_view": true,
            "generic_type_params": [],
            "params": [
                "0x1::string::String"
            ],
            "return": [
                "address"
            ]
        },
        {
            "name": "get_pfp_url",
            "visibility": "public",
            "is_entry": false,
            "is_view": true,
            "generic_type_params": [],
            "params": [
                "address"
            ],
            "return": [
                "0x1::string::String"
            ]
        },
        {
            "name": "get_username",
            "visibility": "public",
            "is_entry": false,
            "is_view": true,
            "generic_type_params": [],
            "params": [
                "address"
            ],
            "return": [
                "0x1::string::String"
            ]
        },
        {
            "name": "has_profile",
            "visibility": "public",
            "is_entry": false,
            "is_view": true,
            "generic_type_params": [],
            "params": [
                "address"
            ],
            "return": [
                "bool"
            ]
        },
        {
            "name": "update_pfp",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": [
                "&signer",
                "0x1::string::String"
            ],
            "return": []
        }
    ],
    "structs": [
        {
            "name": "PfpUpdated",
            "is_native": false,
            "is_event": true,
            "abilities": [
                "drop",
                "store"
            ],
            "generic_type_params": [],
            "fields": [
                {
                    "name": "user",
                    "type": "address"
                },
                {
                    "name": "new_pfp_url",
                    "type": "0x1::string::String"
                }
            ]
        },
        {
            "name": "ProfileCreated",
            "is_native": false,
            "is_event": true,
            "abilities": [
                "drop",
                "store"
            ],
            "generic_type_params": [],
            "fields": [
                {
                    "name": "user",
                    "type": "address"
                },
                {
                    "name": "username",
                    "type": "0x1::string::String"
                },
                {
                    "name": "pfp_url",
                    "type": "0x1::string::String"
                }
            ]
        },
        {
            "name": "UserProfile",
            "is_native": false,
            "is_event": false,
            "abilities": [
                "key"
            ],
            "generic_type_params": [],
            "fields": [
                {
                    "name": "username",
                    "type": "0x1::string::String"
                },
                {
                    "name": "pfp_url",
                    "type": "0x1::string::String"
                }
            ]
        },
        {
            "name": "UsernameRegistry",
            "is_native": false,
            "is_event": false,
            "abilities": [
                "key"
            ],
            "generic_type_params": [],
            "fields": [
                {
                    "name": "usernames",
                    "type": "0x1::table::Table<0x1::string::String, address>"
                }
            ]
        }
    ]
}