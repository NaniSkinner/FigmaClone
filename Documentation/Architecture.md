graph TB
%% Client Side Components
subgraph "Client (Browser)"
subgraph "React/Next.js Frontend"
UI[UI Layer]
Auth[Auth Component]
Canvas[Canvas Component<br/>React-Konva]
Cursor[Cursor Presence]
Objects[Object Renderer]
end

        subgraph "State Management"
            Zustand[Zustand Store]
            CanvasStore[Canvas Store<br/>- Objects<br/>- Scale/Position]
            UserStore[User Store<br/>- User Info<br/>- Color<br/>- Auth State<br/>- Personal Viewport]
        end

        subgraph "Hooks Layer"
            UseAuth[useAuth Hook]
            UseCanvas[useCanvas Hook]
            UseMulti[useMultiplayer Hook]
            UseSync[useRealtimeSync Hook]
        end
    end

    %% Firebase Cloud Services
    subgraph "Firebase Cloud"
        subgraph "Authentication"
            FBAuth[Firebase Auth<br/>- Anonymous (Primary)<br/>- Email/Password<br/>- Google OAuth (Optional)<br/>- Session Management]
        end

        subgraph "Firestore Database"
            subgraph "Collections"
                Users[(users/<br/>userId)]
                Presence[(presence/<br/>userId)]
                Canvases[(canvases/<br/>canvasId)]
                ObjectsColl[(canvases/canvasId/<br/>objects/objectId)]
            end
        end

        subgraph "Real-time Services"
            RTListeners[Real-time Listeners<br/>WebSocket]
            Snapshots[onSnapshot<br/>Listeners]
        end
    end

    %% Deployment
    subgraph "Hosting"
        Vercel[Vercel/Firebase Hosting<br/>- CDN + SSL/HTTPS<br/>- WSS for WebSockets<br/>- CORS Configuration<br/>- Firebase Env Vars]
    end

    %% Connection Flows

    %% Authentication Flow
    Auth -->|Login/Signup| UseAuth
    UseAuth -->|Firebase SDK| FBAuth
    FBAuth -->|User Created| Users
    FBAuth -->|Token| UserStore

    %% Canvas Initialization
    UI -->|Mount| Canvas
    Canvas -->|Initialize| UseCanvas
    UseCanvas -->|Load State| CanvasStore
    UseCanvas -->|Fetch Canvas| Canvases

    %% Cursor Presence Flow
    Cursor -->|Mouse Move<br/>Throttled 30 FPS| UseMulti
    UseMulti -->|Update Position| Presence
    Presence -->|<50ms Broadcast| RTListeners
    RTListeners -->|Cursor Updates| Snapshots
    Snapshots -->|Other Users| Cursor

    %% Object Synchronization
    Objects -->|Create/Move/Delete| UseSync
    UseSync -->|Write Operation| ObjectsColl
    ObjectsColl -->|<100ms Broadcast| RTListeners
    RTListeners -->|Object Changes| Snapshots
    Snapshots -->|Update State| CanvasStore
    CanvasStore -->|Re-render| Objects

    %% State Persistence
    CanvasStore -->|Auto-save| Canvases
    UserStore -->|Presence Update| Presence

    %% Deployment Flow
    UI -->|Static Assets| Vercel
    Vercel -->|HTTPS/WSS| UI

    %% Styling
    classDef clientComponent fill:#4ECDC4,stroke:#333,stroke-width:2px,color:#fff
    classDef firebaseService fill:#FFA502,stroke:#333,stroke-width:2px,color:#fff
    classDef stateStore fill:#A29BFE,stroke:#333,stroke-width:2px,color:#fff
    classDef database fill:#6C5CE7,stroke:#333,stroke-width:2px,color:#fff
    classDef hosting fill:#00B894,stroke:#333,stroke-width:2px,color:#fff
    classDef hooks fill:#74B9FF,stroke:#333,stroke-width:2px,color:#fff

    class UI,Auth,Canvas,Cursor,Objects clientComponent
    class FBAuth,RTListeners,Snapshots firebaseService
    class Zustand,CanvasStore,UserStore stateStore
    class Users,Presence,Canvases,ObjectsColl database
    class Vercel hosting
    class UseAuth,UseCanvas,UseMulti,UseSync hooks

sequenceDiagram
participant U1 as User 1 Browser
participant U2 as User 2 Browser
participant Auth as Firebase Auth
participant FS as Firestore
participant RT as Real-time Listeners
participant P as Presence Collection
participant O as Objects Collection
participant C as Canvas Collection

    %% Authentication Flow
    Note over U1,Auth: Authentication (On Load)
    U1->>Auth: Login/Anonymous Auth
    Auth-->>U1: Auth Token + User ID
    U1->>FS: Create/Update User Doc
    U1->>P: Set Presence (Online)

    %% Initial Canvas Load
    Note over U1,C: Canvas Initialization
    U1->>C: Load Canvas State
    C-->>U1: Viewport + Objects
    U1->>O: Subscribe to Objects
    U1->>P: Subscribe to Presence

    %% User 2 Joins
    Note over U2,Auth: User 2 Joins Session
    U2->>Auth: Login
    Auth-->>U2: Auth Token + User ID
    U2->>P: Set Presence (Online)
    P-->>U1: User 2 Joined (via RT)
    U1->>U1: Show User 2 Cursor

    %% Cursor Movement Sync
    Note over U1,U2: Cursor Sync (<50ms)
    loop Every Mouse Move (Throttled 30 FPS)
        U1->>P: Update Cursor Position
        P->>RT: Broadcast Change
        RT-->>U2: Cursor Update (<50ms)
        U2->>U2: Render U1 Cursor (Interpolated)
    end

    %% Object Creation
    Note over U1,U2: Object Creation (<100ms)
    U1->>U1: Click Canvas
    U1->>O: Create Rectangle
    O->>RT: Broadcast New Object
    RT-->>U2: New Object (<100ms)
    U2->>U2: Render Rectangle
    RT-->>U1: Confirmation
    U1->>U1: Show Confirmed State

    %% Object Movement
    Note over U1,U2: Object Movement
    U1->>U1: Start Drag
    loop During Drag (Throttled)
        U1->>U1: Local Update (60 FPS)
        U1->>O: Update Position
        O->>RT: Broadcast Position
        RT-->>U2: Position Update
        U2->>U2: Update Rectangle
    end
    U1->>U1: End Drag
    U1->>O: Final Position

    %% Conflict Resolution
    Note over U1,U2: Simultaneous Edit Conflict
    par User 1 Moves Object
        U1->>O: Move to (100, 100)
    and User 2 Moves Same Object
        U2->>O: Move to (200, 200)
    end
    O->>O: Last Write Wins
    O->>RT: Broadcast Final State
    RT-->>U1: Final Position
    RT-->>U2: Final Position

    %% State Persistence
    Note over U1,C: Auto-save Canvas State
    U1->>P: Save User Viewport (Per-User)
    loop Every 5 seconds
        U1->>C: Update Last Activity
    end

    %% Disconnection Handling
    Note over U2,P: User 2 Disconnects
    U2->>P: Connection Lost
    P->>P: Wait 30 seconds
    P->>P: Remove User 2
    P->>RT: User 2 Offline
    RT-->>U1: User 2 Left
    U1->>U1: Remove U2 Cursor

    %% Reconnection
    Note over U2,O: User 2 Reconnects
    U2->>Auth: Re-authenticate
    U2->>C: Load Canvas State
    U2->>O: Re-subscribe to Objects
    U2->>P: Set Presence (Online)
    P-->>U1: User 2 Rejoined

    %% Performance Targets
    Note over U1,U2: Performance Requirements
    Note over U1,U2: Cursor Sync: <50ms latency
    Note over U1,U2: Object Sync: <100ms latency
    Note over U1,U2: 60 FPS during interactions
    Note over U1,U2: Support 50+ objects (MVP)
    Note over U1,U2: 500+ objects (stretch goal)
    Note over U1,U2: Support 5+ concurrent users

graph TD
%% Root Application
App[App.tsx<br/>Root Component]

    %% Authentication Flow
    App --> AuthGuard[AuthGuard<br/>Protected Route Wrapper]
    AuthGuard --> LoginPage[Login Page<br/>If Not Authenticated]
    AuthGuard --> CanvasPage[Canvas Page<br/>If Authenticated]

    %% Main Canvas Page Structure
    CanvasPage --> Layout[Layout Wrapper]
    Layout --> Header[Header<br/>- User Info<br/>- Logout Button]
    Layout --> MainCanvas[Main Canvas Container]
    Layout --> Sidebar[Sidebar<br/>Online Users List]

    %% Canvas Components
    MainCanvas --> CanvasControls[Canvas Controls<br/>- Zoom In/Out<br/>- Reset View<br/>- Zoom Level]
    MainCanvas --> KonvaStage[Konva Stage<br/>2000x2000 Viewport]
    MainCanvas --> CursorLayer[Cursor Presence Layer]

    %% Konva Canvas Layers
    KonvaStage --> GridLayer[Grid Layer<br/>Optional Background]
    KonvaStage --> ObjectLayer[Object Layer<br/>All Rectangles]
    KonvaStage --> SelectionLayer[Selection Layer<br/>Selection Borders]

    %% Object Rendering
    ObjectLayer --> ObjectRenderer[Object Renderer<br/>Maps Objects from Store<br/>React.memo for Performance]
    ObjectRenderer --> Rectangle[Rectangle Component<br/>- Draggable<br/>- Selectable<br/>- Memoized<br/>x N instances]

    %% Cursor System
    CursorLayer --> CursorPresence[Cursor Presence<br/>Container<br/>Client-side Interpolation]
    CursorPresence --> CursorComp[Cursor Component<br/>- Name Label<br/>- Color<br/>- Smooth Animation<br/>x N users]

    %% Sidebar Components
    Sidebar --> OnlineUsers[Online Users<br/>Presence List]
    OnlineUsers --> UserAvatar[User Avatar<br/>- Color Indicator<br/>- Name<br/>x N users]

    %% State Management Flow
    subgraph "Zustand Stores"
        CanvasState[Canvas Store<br/>- Objects Array<br/>- Scale]
        UserState[User Store<br/>- Current User<br/>- Auth State<br/>- Personal Viewport]
        PresenceState[Presence Store<br/>- Online Users Array<br/>- Cursors Map]
    end

    %% Hooks Integration
    subgraph "Custom Hooks"
        HAuth[useAuth<br/>Firebase Auth]
        HCanvas[useCanvas<br/>Pan/Zoom Logic]
        HMulti[useMultiplayer<br/>Cursor Broadcast]
        HSync[useRealtimeSync<br/>Object Sync]
    end

    %% Data Flow Connections
    LoginPage -.->|Auth Success| HAuth
    HAuth -.->|User Data| UserState

    CanvasPage -.->|Initialize| HCanvas
    HCanvas -.->|Viewport| CanvasState

    CursorPresence -.->|Track Mouse| HMulti
    HMulti -.->|Cursor Data| PresenceState

    ObjectRenderer -.->|Listen Changes| HSync
    HSync -.->|Object Updates| CanvasState

    CanvasState -.->|Objects| ObjectRenderer
    PresenceState -.->|Cursors| CursorPresence
    UserState -.->|User Info| Header
    PresenceState -.->|Online Users| OnlineUsers

    %% Event Flow
    Rectangle -->|onDragEnd| HSync
    KonvaStage -->|onWheel| HCanvas
    KonvaStage -->|onMouseMove| HMulti
    CanvasControls -->|onClick| HCanvas

    %% Firebase Connections
    subgraph "Firebase Services"
        FBAuth2[Firebase Auth]
        FBFirestore[Firestore DB]
        FBListeners[Real-time Listeners]
    end

    HAuth -.->|API Calls| FBAuth2
    HSync -.->|Read/Write| FBFirestore
    HMulti -.->|Presence Updates| FBFirestore
    FBListeners -.->|Push Updates| HSync
    FBListeners -.->|Push Cursors| HMulti

    %% Styling
    classDef component fill:#4ECDC4,stroke:#333,stroke-width:2px
    classDef store fill:#A29BFE,stroke:#333,stroke-width:2px
    classDef hook fill:#74B9FF,stroke:#333,stroke-width:2px
    classDef firebase fill:#FFA502,stroke:#333,stroke-width:2px
    classDef canvas fill:#00B894,stroke:#333,stroke-width:2px

    class App,AuthGuard,LoginPage,CanvasPage,Layout,Header,MainCanvas,Sidebar,CanvasControls,CursorLayer,CursorPresence,CursorComp,OnlineUsers,UserAvatar component
    class CanvasState,UserState,PresenceState store
    class HAuth,HCanvas,HMulti,HSync hook
    class FBAuth2,FBFirestore,FBListeners firebase
    class KonvaStage,GridLayer,ObjectLayer,SelectionLayer,ObjectRenderer,Rectangle canvas

graph TB
subgraph "User Clients"
Client1[User 1<br/>Browser<br/>React App]
Client2[User 2<br/>Browser<br/>React App]
Client3[User 3<br/>Browser<br/>React App]
ClientN[User N<br/>Browser<br/>React App]
end

    subgraph "CDN Edge (Vercel)"
        Static[Static Assets<br/>- HTML/CSS/JS<br/>- React Bundles<br/>- Images]
        NextServer[Next.js Server (Optional)<br/>- Static Export Preferred<br/>- Minimal Backend<br/>- Firestore handles real-time]
    end

    subgraph "WebSocket Connections"
        WS1[WebSocket<br/>User 1<br/>Firestore Listener<br/>Persistent Connection]
        WS2[WebSocket<br/>User 2<br/>Firestore Listener<br/>Persistent Connection]
        WS3[WebSocket<br/>User 3<br/>Firestore Listener<br/>Persistent Connection]
        WSN[WebSocket<br/>User N<br/>Firestore Listener<br/>Persistent Connection]
    end

    subgraph "Firebase Infrastructure"
        subgraph "Firebase Auth"
            AuthService[Authentication Service<br/>- Token Generation<br/>- Session Management]
        end

        subgraph "Firestore Real-time"
            RTEngine[Real-time Engine<br/>- Change Detection<br/>- Event Broadcasting]

            subgraph "Data Listeners"
                PresenceListener[Presence Listener<br/>Per-User Presence<br/>30s TTL<br/>50ms broadcast]
                ObjectListener[Objects Listener<br/>100ms broadcast]
                CanvasListener[Canvas Listener<br/>State persistence<br/>Single Canvas MVP]
            end
        end

        subgraph "Firestore Storage"
            Collections[(Collections<br/>- users<br/>- presence (per-user)<br/>- canvases (single MVP)<br/>- canvases/{id}/objects)]
        end
    end

    subgraph "Data Flow Paths"
        CursorPath[Cursor Updates<br/>30 FPS Throttle<br/><50ms Target]
        ObjectPath[Object Updates<br/>10 FPS Throttle<br/><100ms Target]
        StatePath[State Saves<br/>On Change<br/>Debounced]
    end

    %% Initial Load
    Client1 -->|HTTPS GET| Static
    Static -->|Bundle| Client1
    Client1 -->|Auth Request| AuthService
    AuthService -->|JWT Token| Client1

    %% WebSocket Establishment
    Client1 -->|Establish| WS1
    Client2 -->|Establish| WS2
    Client3 -->|Establish| WS3
    ClientN -->|Establish| WSN

    %% Real-time Connections
    WS1 <-->|Bidirectional| RTEngine
    WS2 <-->|Bidirectional| RTEngine
    WS3 <-->|Bidirectional| RTEngine
    WSN <-->|Bidirectional| RTEngine

    %% Listener Subscriptions
    RTEngine --> PresenceListener
    RTEngine --> ObjectListener
    RTEngine --> CanvasListener

    %% Database Operations
    PresenceListener <--> Collections
    ObjectListener <--> Collections
    CanvasListener <--> Collections

    %% Broadcast Patterns
    subgraph "Broadcast Patterns"
        FanOut[Fan-Out Pattern<br/>1 Change → N Clients]
        Multicast[Multicast<br/>Selective Updates]
        Unicast[Unicast<br/>Direct Messages]
    end

    RTEngine --> FanOut
    FanOut --> WS1
    FanOut --> WS2
    FanOut --> WS3

    %% Performance Monitoring
    subgraph "Performance Metrics"
        Metrics[Metrics<br/>- Latency: <50ms cursor<br/>- Latency: <100ms objects<br/>- FPS: 60<br/>- Connections: 5+<br/>- Objects: 50+ (MVP)<br/>- Objects: 500+ (stretch)]
    end

    RTEngine -.->|Monitor| Metrics

    %% Failure Handling
    subgraph "Failure Recovery"
        Reconnect[Auto-Reconnect<br/>Exponential Backoff]
        Queue[Offline Queue<br/>Pending Operations]
        Sync[State Reconciliation<br/>On Reconnect]
    end

    WS1 -.->|On Disconnect| Reconnect
    Reconnect -.->|Retry| WS1
    Client1 -.->|While Offline| Queue
    Queue -.->|On Reconnect| Sync

    %% Rate Limiting
    subgraph "Rate Limits"
        RateLimit[Rate Limiting<br/>- Cursor: 30/sec<br/>- Objects: 10/sec<br/>- Per User Limits]
    end

    RTEngine --> RateLimit
    RateLimit --> Collections

    %% Styling
    classDef client fill:#4ECDC4,stroke:#333,stroke-width:2px
    classDef cdn fill:#00B894,stroke:#333,stroke-width:2px
    classDef websocket fill:#74B9FF,stroke:#333,stroke-width:2px
    classDef firebase fill:#FFA502,stroke:#333,stroke-width:2px
    classDef data fill:#A29BFE,stroke:#333,stroke-width:2px
    classDef monitor fill:#FF6B6B,stroke:#333,stroke-width:2px

    class Client1,Client2,Client3,ClientN client
    class Static,NextServer cdn
    class WS1,WS2,WS3,WSN websocket
    class AuthService,RTEngine,PresenceListener,ObjectListener,CanvasListener,Collections firebase
    class CursorPath,ObjectPath,StatePath data
    class Metrics,RateLimit monitor

graph TD
%% Root Application
App[App.tsx<br/>Root Component]

    %% Authentication Flow
    App --> AuthGuard[AuthGuard<br/>Protected Route Wrapper]
    AuthGuard --> LoginPage[Login Page<br/>If Not Authenticated]
    AuthGuard --> CanvasPage[Canvas Page<br/>If Authenticated]

    %% Main Canvas Page Structure
    CanvasPage --> Layout[Layout Wrapper]
    Layout --> Header[Header<br/>- User Info<br/>- Logout Button]
    Layout --> MainCanvas[Main Canvas Container]
    Layout --> Sidebar[Sidebar<br/>Online Users List]

    %% Canvas Components
    MainCanvas --> CanvasControls[Canvas Controls<br/>- Zoom In/Out<br/>- Reset View<br/>- Zoom Level]
    MainCanvas --> KonvaStage[Konva Stage<br/>2000x2000 Viewport]
    MainCanvas --> CursorLayer[Cursor Presence Layer]

    %% Konva Canvas Layers
    KonvaStage --> GridLayer[Grid Layer<br/>Optional Background]
    KonvaStage --> ObjectLayer[Object Layer<br/>All Rectangles]
    KonvaStage --> SelectionLayer[Selection Layer<br/>Selection Borders]

    %% Object Rendering
    ObjectLayer --> ObjectRenderer[Object Renderer<br/>Maps Objects from Store<br/>React.memo for Performance]
    ObjectRenderer --> Rectangle[Rectangle Component<br/>- Draggable<br/>- Selectable<br/>- Memoized<br/>x N instances]

    %% Cursor System
    CursorLayer --> CursorPresence[Cursor Presence<br/>Container<br/>Client-side Interpolation]
    CursorPresence --> CursorComp[Cursor Component<br/>- Name Label<br/>- Color<br/>- Smooth Animation<br/>x N users]

    %% Sidebar Components
    Sidebar --> OnlineUsers[Online Users<br/>Presence List]
    OnlineUsers --> UserAvatar[User Avatar<br/>- Color Indicator<br/>- Name<br/>x N users]

    %% State Management Flow
    subgraph "Zustand Stores"
        CanvasState[Canvas Store<br/>- Objects Array<br/>- Scale]
        UserState[User Store<br/>- Current User<br/>- Auth State<br/>- Personal Viewport]
        PresenceState[Presence Store<br/>- Online Users Array<br/>- Cursors Map]
    end

    %% Hooks Integration
    subgraph "Custom Hooks"
        HAuth[useAuth<br/>Firebase Auth]
        HCanvas[useCanvas<br/>Pan/Zoom Logic]
        HMulti[useMultiplayer<br/>Cursor Broadcast]
        HSync[useRealtimeSync<br/>Object Sync]
    end

    %% Data Flow Connections
    LoginPage -.->|Auth Success| HAuth
    HAuth -.->|User Data| UserState

    CanvasPage -.->|Initialize| HCanvas
    HCanvas -.->|Viewport| CanvasState

    CursorPresence -.->|Track Mouse| HMulti
    HMulti -.->|Cursor Data| PresenceState

    ObjectRenderer -.->|Listen Changes| HSync
    HSync -.->|Object Updates| CanvasState

    CanvasState -.->|Objects| ObjectRenderer
    PresenceState -.->|Cursors| CursorPresence
    UserState -.->|User Info| Header
    PresenceState -.->|Online Users| OnlineUsers

    %% Event Flow
    Rectangle -->|onDragEnd| HSync
    KonvaStage -->|onWheel| HCanvas
    KonvaStage -->|onMouseMove| HMulti
    CanvasControls -->|onClick| HCanvas

    %% Firebase Connections
    subgraph "Firebase Services"
        FBAuth2[Firebase Auth]
        FBFirestore[Firestore DB]
        FBListeners[Real-time Listeners]
    end

    HAuth -.->|API Calls| FBAuth2
    HSync -.->|Read/Write| FBFirestore
    HMulti -.->|Presence Updates| FBFirestore
    FBListeners -.->|Push Updates| HSync
    FBListeners -.->|Push Cursors| HMulti

    %% Styling
    classDef component fill:#4ECDC4,stroke:#333,stroke-width:2px
    classDef store fill:#A29BFE,stroke:#333,stroke-width:2px
    classDef hook fill:#74B9FF,stroke:#333,stroke-width:2px
    classDef firebase fill:#FFA502,stroke:#333,stroke-width:2px
    classDef canvas fill:#00B894,stroke:#333,stroke-width:2px

    class App,AuthGuard,LoginPage,CanvasPage,Layout,Header,MainCanvas,Sidebar,CanvasControls,CursorLayer,CursorPresence,CursorComp,OnlineUsers,UserAvatar component
    class CanvasState,UserState,PresenceState store
    class HAuth,HCanvas,HMulti,HSync hook
    class FBAuth2,FBFirestore,FBListeners firebase
    class KonvaStage,GridLayer,ObjectLayer,SelectionLayer,ObjectRenderer,Rectangle canvas
