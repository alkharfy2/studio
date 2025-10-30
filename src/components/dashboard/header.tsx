"use client"
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "../ui/dropdown-menu";
import { useUser, useFirebaseApp } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";


export default function DashboardHeader() {
    const { user } = useUser();
    const app = useFirebaseApp();
    const auth = getAuth(app);
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <div className="flex-1">
                {/* Search can go here if needed */}
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Toggle notifications</span>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 flex items-center gap-2">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || ''} data-ai-hint="person" />
                                <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="hidden md:inline">{user?.displayName || user?.email}</span>
                            <ChevronDown className="h-4 w-4 hidden md:inline"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
