import { MODULE_ADDRESS } from "../movement_service/constants";

export const ABI = {
    "address": MODULE_ADDRESS,
    "name": "puffer_pins",
    "friends": [],
    "exposed_functions": [
        {
            "name": "claim_treasury",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": [
                "&signer",
                "u64"
            ],
            "return": []
        },
        {
            "name": "get_treasury_balance",
            "visibility": "public",
            "is_entry": false,
            "is_view": true,
            "generic_type_params": [],
            "params": [],
            "return": [
                "u64"
            ]
        },
        {
            "name": "is_pinned",
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
            "name": "pin_user",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": [
                "&signer",
                "u64"
            ],
            "return": []
        }
    ],
    "structs": [
        {
            "name": "PinStore",
            "is_native": false,
            "is_event": false,
            "abilities": [
                "key"
            ],
            "generic_type_params": [],
            "fields": [
                {
                    "name": "treasury",
                    "type": "0x1::coin::Coin<0x1::aptos_coin::AptosCoin>"
                },
                {
                    "name": "admin",
                    "type": "address"
                },
                {
                    "name": "pinned_users",
                    "type": "0x1::table::Table<address, u64>"
                }
            ]
        },
        {
            "name": "UserPinned",
            "is_native": false,
            "is_event": true,
            "abilities": [
                "drop",
                "store"
            ],
            "generic_type_params": [],
            "fields": [
                {
                    "name": "game_id",
                    "type": "u64"
                },
                {
                    "name": "user",
                    "type": "address"
                },
                {
                    "name": "fee_paid",
                    "type": "u64"
                },
                {
                    "name": "expires_at",
                    "type": "u64"
                }
            ]
        }
    ]
}