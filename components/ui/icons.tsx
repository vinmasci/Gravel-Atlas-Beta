import {
    Camera,
    Map,
    Layers,
    Search,
    User,
    Menu,
    X,
    ChevronRight,
    ChevronLeft,
    Plus,
    Minus,
    Compass,
    Upload,
    Image,
    MapPin,
    Road,
    Mountain,
    Navigation,
    LucideProps,
    Sun,
    Moon,
    Settings
  } from "lucide-react"
  
  export const Icons = {
    camera: Camera,
    map: Map,
    layers: Layers,
    search: Search,
    user: User,
    menu: Menu,
    close: X,
    chevronRight: ChevronRight,
    chevronLeft: ChevronLeft,
    plus: Plus,
    minus: Minus,
    compass: Compass,
    upload: Upload,
    image: Image,
    mapPin: MapPin,
    road: Road,
    mountain: Mountain,
    navigation: Navigation,
    sun: Sun,
    moon: Moon,
    settings: Settings,
    // Custom logo icon example
    logo: (props: LucideProps) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M3 7v4a1 1 0 0 0 1 1h3" />
        <path d="M7 7v10" />
        <path d="M10 8v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-8a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1z" />
        <path d="M17 7v4a1 1 0 0 0 1 1h3" />
        <path d="M21 7v10" />
      </svg>
    ),
  }