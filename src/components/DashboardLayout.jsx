
import React from 'react';
import { Box, Container, Flex, HStack, Text, Button, Badge, Separator, Link as ChakraLink, Stack } from '@chakra-ui/react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { ColorModeButton } from "@/components/ui/color-mode"
import { Avatar } from "@/components/ui/avatar"
import { LogOut, Calculator, Users, Calendar, Briefcase, DollarSign } from 'lucide-react';
import { Logo } from './Logo';

const DashboardLayout = () => {
    const { user, profile, clearAuth, isStakeholder, isProjectManager, isRestrictedEmployee } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        clearAuth();
        navigate("/login");
    };

    // Menu Visibility
    const showCalculator = isStakeholder || isProjectManager;
    const showTeamDB = isStakeholder;
    const showAttendance = true; // Visible to everyone
    const showLeave = true; // Visible to everyone
    const showPayroll = true; // Visible to everyone

    const NavLink = ({ to, children }) => {
        const isActive = location.pathname === to;
        return (
            <Link to={to}>
                <Box
                    px={1}
                    py={3}
                    borderBottomWidth="2px"
                    borderColor={isActive ? "fg.default" : "transparent"}
                    color={isActive ? "fg.default" : "fg.muted"}
                    fontWeight="medium"
                    fontSize="sm"
                    _hover={{ color: "fg.default", borderColor: isActive ? "fg.default" : "border" }}
                    transition="all 0.2s"
                >
                    {children}
                </Box>
            </Link>
        )
    }

    return (
        <Box minH="100vh" bg="bg.canvas">
            {/* --- TOPBAR --- */}
            <Box
                bg="bg/80"
                backdropFilter="blur(10px)"
                borderBottomWidth="1px"
                borderColor="border"
                position="sticky"
                top="0"
                zIndex="sticky"
            >
                <Container maxW="container.xl">
                    <Stack gap={0}>
                        {/* ROW 1: Logo & Actions */}
                        <Flex h="16" align="center" justify="space-between">
                            {/* Logo */}
                            <Box w="120px" color="fg.default">
                                <Logo h="28px" w="auto" />
                            </Box>

                            {/* RIGHT: User Profile & Actions */}
                            <HStack gap={4}>
                                <ColorModeButton />
                                <Separator orientation="vertical" height="16px" />

                                <HStack gap={3}>
                                    <Box textAlign="right" display={{ base: "none", md: "block" }}>
                                        <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                                            {profile?.job_title ? profile.job_title.replace('_', ' ') : profile?.role || "EMPLOYEE"}
                                        </Text>
                                    </Box>
                                    <Avatar
                                        name={profile?.name || user?.email}
                                        size="xs"
                                        src={profile?.avatar_url}
                                    />
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        colorPalette="gray"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={14} />
                                    </Button>
                                </HStack>
                            </HStack>
                        </Flex>

                        {/* ROW 2: Navigation Tabs */}
                        <HStack gap={6} display={{ base: "none", md: "flex" }} overflowX="auto">
                            {showCalculator && <NavLink to="/">Calculator</NavLink>}
                            {showTeamDB && <NavLink to="/team">Team</NavLink>}
                            {showAttendance && <NavLink to="/attendance">Attendance</NavLink>}
                            <NavLink to="/leave">Leave</NavLink>
                            <NavLink to="/payroll">Payroll</NavLink>
                        </HStack>
                    </Stack>
                </Container>
            </Box>

            {/* --- MAIN CONTENT --- */}
            <Box py={8}>
                <Container maxW="container.xl">
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
};

export default DashboardLayout;
