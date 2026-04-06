import { MODULE_ADDRESS } from "../movement_service/constants";

export const ABI = {
    "address": MODULE_ADDRESS,
    "name": "game",
    "friends": [],
    "exposed_functions": [
        {
            "name": "add_sponsorship",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": [
                "&signer",
                "u64",
                "0x1::string::String",
                "0x1::string::String",
                "u64"
            ],
            "return": []
        },
        {
            "name": "claim_admin_fees",
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
            "name": "claim_rewards",
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
            "name": "create_game",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": [
                "&signer",
                "0x1::string::String",
                "0x1::string::String",
                "u64",
                "u64",
                "u64",
                "u64",
                "bool",
                "address",
                "vector<u8>",
                "u64",
                "0x1::string::String",
                "0x1::string::String"
            ],
            "return": []
        },
        {
            "name": "get_total_games_count",
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
            "name": "get_vault_balances",
            "visibility": "public",
            "is_entry": false,
            "is_view": true,
            "generic_type_params": [],
            "params": [
                "u64"
            ],
            "return": [
                "u64",
                "u64",
                "u64"
            ]
        },
        {
            "name": "join_game",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": [
                "&signer",
                "u64",
                "vector<u8>",
                "address"
            ],
            "return": []
        },
        {
            "name": "record_daily_steps",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": [
                "&signer",
                "address",
                "u64",
                "u64",
                "u64"
            ],
            "return": []
        },
        {
            "name": "set_oracle",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": [
                "&signer",
                "address"
            ],
            "return": []
        },
        {
            "name": "set_secondary_admin",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": [
                "&signer",
                "address"
            ],
            "return": []
        },
        {
            "name": "sweep_unclaimed",
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
            "name": "toggle_pause",
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
            "name": "Game",
            "is_native": false,
            "is_event": false,
            "abilities": [
                "store"
            ],
            "generic_type_params": [],
            "fields": [
                {
                    "name": "id",
                    "type": "u64"
                },
                {
                    "name": "name",
                    "type": "0x1::string::String"
                },
                {
                    "name": "image_url",
                    "type": "0x1::string::String"
                },
                {
                    "name": "deposit_amount",
                    "type": "u64"
                },
                {
                    "name": "daily_stake_standard",
                    "type": "u64"
                },
                {
                    "name": "daily_stake_final",
                    "type": "u64"
                },
                {
                    "name": "min_daily_steps",
                    "type": "u64"
                },
                {
                    "name": "start_time",
                    "type": "u64"
                },
                {
                    "name": "end_time",
                    "type": "u64"
                },
                {
                    "name": "no_of_days",
                    "type": "u64"
                },
                {
                    "name": "is_sponsored",
                    "type": "bool"
                },
                {
                    "name": "is_paused",
                    "type": "bool"
                },
                {
                    "name": "is_public",
                    "type": "bool"
                },
                {
                    "name": "required_nft",
                    "type": "address"
                },
                {
                    "name": "join_code_hash",
                    "type": "vector<u8>"
                },
                {
                    "name": "sponsors",
                    "type": "vector<0xbe0da9a00793b7935eadc9064d5f5e4a531fe3deb598fa7f8fa0637402e93177::game::Sponsor>"
                },
                {
                    "name": "prize_vault",
                    "type": "0x1::coin::Coin<0x1::aptos_coin::AptosCoin>"
                },
                {
                    "name": "sponsored_vault",
                    "type": "0x1::coin::Coin<0x1::aptos_coin::AptosCoin>"
                },
                {
                    "name": "admin_fee_vault",
                    "type": "0x1::coin::Coin<0x1::aptos_coin::AptosCoin>"
                },
                {
                    "name": "daily_forfeited_pool",
                    "type": "vector<u64>"
                },
                {
                    "name": "day_winners_count",
                    "type": "vector<u64>"
                },
                {
                    "name": "perfect_winners_count",
                    "type": "u64"
                },
                {
                    "name": "participants",
                    "type": "vector<address>"
                },
                {
                    "name": "participants_joined",
                    "type": "0x1::table::Table<address, bool>"
                }
            ]
        },
        {
            "name": "GameCreated",
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
                    "name": "name",
                    "type": "0x1::string::String"
                },
                {
                    "name": "deposit_amount",
                    "type": "u64"
                },
                {
                    "name": "is_public",
                    "type": "bool"
                },
                {
                    "name": "start_time",
                    "type": "u64"
                },
                {
                    "name": "end_time",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "GameJoined",
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
                }
            ]
        },
        {
            "name": "GameProgress",
            "is_native": false,
            "is_event": false,
            "abilities": [
                "store"
            ],
            "generic_type_params": [],
            "fields": [
                {
                    "name": "days_completed",
                    "type": "vector<bool>"
                },
                {
                    "name": "missed_days",
                    "type": "u64"
                },
                {
                    "name": "has_withdrawn",
                    "type": "bool"
                }
            ]
        },
        {
            "name": "GameStore",
            "is_native": false,
            "is_event": false,
            "abilities": [
                "key"
            ],
            "generic_type_params": [],
            "fields": [
                {
                    "name": "games",
                    "type": "vector<0xbe0da9a00793b7935eadc9064d5f5e4a531fe3deb598fa7f8fa0637402e93177::game::Game>"
                },
                {
                    "name": "admin",
                    "type": "address"
                },
                {
                    "name": "secondary_admin",
                    "type": "address"
                },
                {
                    "name": "oracle",
                    "type": "address"
                }
            ]
        },
        {
            "name": "RewardClaimed",
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
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "Sponsor",
            "is_native": false,
            "is_event": false,
            "abilities": [
                "copy",
                "drop",
                "store"
            ],
            "generic_type_params": [],
            "fields": [
                {
                    "name": "name",
                    "type": "0x1::string::String"
                },
                {
                    "name": "image_url",
                    "type": "0x1::string::String"
                },
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "SponsorshipAdded",
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
                    "name": "sponsor_name",
                    "type": "0x1::string::String"
                },
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "StepRecorded",
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
                    "name": "day_idx",
                    "type": "u64"
                },
                {
                    "name": "met_criteria",
                    "type": "bool"
                }
            ]
        },
        {
            "name": "UserParticipation",
            "is_native": false,
            "is_event": false,
            "abilities": [
                "key"
            ],
            "generic_type_params": [],
            "fields": [
                {
                    "name": "games_status",
                    "type": "0x1::table::Table<u64, 0xbe0da9a00793b7935eadc9064d5f5e4a531fe3deb598fa7f8fa0637402e93177::game::GameProgress>"
                }
            ]
        }
    ]
}