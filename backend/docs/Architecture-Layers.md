┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  (Controllers, Routes, Middleware, DTOs)                    │
│  • Handles HTTP requests/responses                          │
│  • Validates input data                                      │
│  • Maps domain errors to HTTP status codes                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  (Services, Interfaces)                                      │
│  • Business logic orchestration                              │
│  • Transaction management                                    │
│  • Cache management                                          │
│  • Cross-entity operations                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                           │
│  (Models, Business Rules)                                    │
│  • Core business entities                                    │
│  • Business rules validation                                 │
│  • Domain logic                                              │
│  • No external dependencies                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                      │
│  (Repositories, Database, External Services)                 │
│  • Data persistence                                          │
│  • External API integration                                  │
│  • Database queries                                          │
│  • File system operations                                    │
└─────────────────────────────────────────────────────────────┘
