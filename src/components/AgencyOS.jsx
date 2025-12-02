
import React, { useState, useMemo } from 'react';
import {
    Box,
    Container,
    Grid,
    Heading,
    Text,
    Input,
    Stack,
    Button,
    Card,
    Badge,
    Tabs,
    Table,
    HStack,
    VStack,
    Separator,
    IconButton,
} from '@chakra-ui/react';
import { Avatar } from "@/components/ui/avatar"
import { ColorModeButton } from "@/components/ui/color-mode"
import { Slider } from "@/components/ui/slider"
import {
    NativeSelectRoot,
    NativeSelectField,
} from "@/components/ui/native-select"
import { NumberInputRoot, NumberInputField } from "@/components/ui/number-input"
import {
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogActionTrigger,
} from "@/components/ui/dialog"
import { Trash2, Plus, Users, Calculator, DollarSign, Briefcase, Calendar, Edit2, LogOut } from 'lucide-react';
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useAuthStore } from "../store/useAuthStore"
import { useEmployees } from "../hooks/useEmployees"

// Dummy Data - INITIAL_TEAM removed as data now comes from useEmployees
const INITIAL_PHASES = [
    { id: '1', name: 'Discovery & Strategy', days: 5, buffer: 2 },
    { id: '2', name: 'Design System', days: 10, buffer: 3 },
    { id: '3', name: 'Development', days: 20, buffer: 5 },
];

const AgencyOS = () => {
    const navigate = useNavigate()
    const clearAuth = useAuthStore((state) => state.clearAuth)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        clearAuth()
        navigate("/login")
    }

    // --- AUTH & PROFILE ---
    const { user, profile, setProfile } = useAuthStore()

    React.useEffect(() => {
        const fetchProfile = async () => {
            if (user?.email) {
                const { data, error } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('email', user.email)
                    .single()

                if (data) {
                    setProfile(data)
                }
            }
        }
        fetchProfile()
    }, [user, setProfile])

    const isStakeholder = profile?.role === 'STAKEHOLDER'
    const isProjectManager = profile?.job_title === 'PROJECT_MANAGER'
    const canViewCalculator = isStakeholder || isProjectManager
    const canViewTeamDB = isStakeholder

    // --- DATA FETCHING ---
    const { employees, isLoading: isLoadingEmployees, addEmployee, updateEmployee, deleteEmployee } = useEmployees()

    // --- STATE ---

    // 1. Project Context
    const [projectContext, setProjectContext] = useState({
        revenue: 15000,
        exchangeRate: 15500,
        hoursPerDay: 8,
        platformFeePercent: 10,
    });

    // 2. Timeline Engine
    const [phases, setPhases] = useState(INITIAL_PHASES);

    // 3. Team Database State
    // teamDatabase state removed, using 'employees' from useEmployees hook
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null); // null = adding new, object = editing

    // 4. Squad Allocation
    const [squad, setSquad] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState('');

    // --- CALCULATIONS ---

    const totalDays = useMemo(() => {
        return phases.reduce((acc, phase) => acc + Number(phase.days) + Number(phase.buffer), 0);
    }, [phases]);

    const squadCost = useMemo(() => {
        // Calculations
        return squad.reduce((acc, member) => {
            // Cost = (Hourly Rate * Hours/Day * Total Days * Allocation%)
            const memberCost = member.hourly_rate * projectContext.hoursPerDay * totalDays * (member.allocation / 100);
            return acc + memberCost;
        }, 0);
    }, [squad, totalDays, projectContext.hoursPerDay]);

    const platformFee = (projectContext.revenue * projectContext.platformFeePercent) / 100;
    const totalCost = squadCost + platformFee;
    const netProfit = projectContext.revenue - totalCost;
    const margin = (netProfit / projectContext.revenue) * 100;

    // --- HANDLERS ---

    // Project Context Handlers
    const handleContextChange = (e) => {
        const { name, value } = e.target;
        setProjectContext(prev => ({ ...prev, [name]: Number(value) }));
    };

    // Timeline Handlers
    const addPhase = () => {
        setPhases([...phases, { id: Date.now().toString(), name: 'New Phase', days: 0, buffer: 0 }]);
    };

    const removePhase = (id) => {
        setPhases(phases.filter(p => p.id !== id));
    };

    const updatePhase = (id, field, value) => {
        setPhases(phases.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    // Squad Handlers
    const addSquadMember = () => {
        const member = employees.find(m => m.id === selectedMemberId); // Use 'employees' from hook
        if (member && !squad.find(s => s.id === member.id)) {
            setSquad([...squad, { ...member, allocation: 100 }]); // Default 100% allocation
        }
        setSelectedMemberId('');
    };

    const removeSquadMember = (id) => {
        setSquad(squad.filter(s => s.id !== id));
    };

    const updateSquadAllocation = (id, value) => {
        setSquad(squad.map(s => s.id === id ? { ...s, allocation: value } : s));
    };

    // Team Database Handlers
    const handleAddMember = async () => {
        if (editingMember.name && editingMember.role && editingMember.hourly_rate) {
            try {
                await addEmployee.mutateAsync({
                    name: editingMember.name,
                    role: editingMember.role,
                    hourly_rate: Number(editingMember.hourly_rate),
                    email: editingMember.email || "", // Optional
                    status: "AVAILABLE"
                })
                setIsDialogOpen(false);
                setEditingMember(null);
            } catch (error) {
                console.error("Failed to add member:", error)
                // You might want to show a toast here
            }
        }
    };

    const handleUpdateMember = async () => {
        if (editingMember.id && editingMember.name && editingMember.role && editingMember.hourly_rate) {
            try {
                await updateEmployee.mutateAsync({
                    id: editingMember.id,
                    name: editingMember.name,
                    role: editingMember.role,
                    hourly_rate: Number(editingMember.hourly_rate),
                    email: editingMember.email || ""
                })
                setIsDialogOpen(false);
                setEditingMember(null);
            } catch (error) {
                console.error("Failed to update member:", error)
            }
        }
    };

    const removeTeamMember = async (id) => {
        if (confirm("Are you sure you want to remove this member?")) {
            try {
                await deleteEmployee.mutateAsync(id)
                // Also remove from squad if present
                setSquad(squad.filter(s => s.id !== id));
            } catch (error) {
                console.error("Failed to delete member:", error)
            }
        }
    };

    const openAddMemberDialog = () => {
        setEditingMember({ name: '', role: '', hourly_rate: 0, email: '' });
        setIsDialogOpen(true);
    };

    const openEditMemberDialog = (member) => {
        setEditingMember({ ...member }); // member already has hourly_rate
        setIsDialogOpen(true);
    };

    // --- RENDER HELPERS ---
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <Tabs.Root defaultValue="calculator" variant="line">
            <Box minH="100vh" bg="bg.panel" fontFamily="Inter, sans-serif">
                {/* STICKY HEADER */}
                <Box
                    as="header"
                    position="sticky"
                    top="0"
                    zIndex="sticky"
                    bg="bg.panel/80"
                    backdropFilter="blur(10px)"
                    borderBottom="1px solid"
                    borderColor="border.muted"
                >
                    <Container maxW="container.xl">
                        <HStack h="16" justify="space-between">
                            <HStack gap={8}>
                                <a href="/" aria-label="Agency OS Home">
                                    <Box w="140px" color="fg">
                                        <svg width="140" height="36" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <g clipPath="url(#clip0_228_8)">
                                                <g clipPath="url(#clip1_228_8)">
                                                    <g clipPath="url(#clip2_228_8)">
                                                        <rect x="14.497" y="3.7345" width="7.35162" height="14.4189" fill="currentColor" />
                                                    </g>
                                                    <g clipPath="url(#clip3_228_8)">
                                                        <rect x="14.497" y="17.9058" width="7.35162" height="14.4189" fill="currentColor" />
                                                    </g>
                                                    <g clipPath="url(#clip4_228_8)">
                                                        <rect x="28.6964" y="7.70935" width="7.35073" height="14.293" transform="rotate(60 28.6964 7.70935)" fill="currentColor" />
                                                    </g>
                                                    <g clipPath="url(#clip5_228_8)">
                                                        <rect x="16.3177" y="14.8558" width="7.35073" height="14.293" transform="rotate(60 16.3177 14.8558)" fill="currentColor" />
                                                    </g>
                                                    <g clipPath="url(#clip6_228_8)">
                                                        <rect x="14.7061" y="20.2911" width="7.35001" height="16.1545" transform="rotate(-60 14.7061 20.2911)" fill="currentColor" />
                                                    </g>
                                                </g>
                                                <path d="M132.269 29.1645V27.3608C130.851 29.0034 129.112 29.551 126.986 29.551C123.379 29.551 120.867 27.7473 120.867 24.4299C120.867 21.4346 122.864 20.0497 127.47 19.2445L132.14 18.4393V17.6663C132.14 16.4102 131.496 15.5406 129.402 15.5406C127.631 15.5406 126.407 16.3458 126.374 17.8273H121.672C121.737 13.898 125.086 12.0299 129.37 12.0299C134.33 12.0299 136.745 13.9946 136.745 17.1187V29.1645H132.269ZM125.666 24.2689C125.666 25.4606 126.536 26.2336 128.243 26.2336C130.272 26.2336 132.140 25.2351 132.140 22.7551V21.4024L128.404 22.1432C126.600 22.4974 125.666 22.9162 125.666 24.2689Z" fill="currentColor" />
                                                <path d="M104.098 35.6061V31.8378H106.868C108.575 31.8378 108.929 31.3869 109.477 29.8087L109.606 29.4544L103.261 12.4165H108.35L112.15 24.8809L115.854 12.4165H120.911L114.276 30.6139C113.213 33.577 111.764 35.6061 108.189 35.6061H104.098Z" fill="currentColor" />
                                                <path d="M94.4571 7.26318H99.1916V12.4164H103.314V15.9271H99.1916V24.1723C99.1916 25.1707 99.5459 25.6539 100.738 25.6539H103.314V29.1645H99.4493C96.6794 29.1645 94.4571 28.4237 94.4571 24.6554V15.9271H91.5906V12.4164H94.4571V7.26318Z" fill="currentColor" />
                                                <path d="M82.6702 29.551C77.2593 29.551 74.1674 25.7826 74.1674 20.7904C74.1674 15.7982 77.2593 12.0299 82.6702 12.0299C88.0811 12.0299 91.1731 15.605 91.1731 21.2736V22.2398H78.7731C79.1596 24.5588 80.5123 25.9759 82.6702 25.9759C84.5383 25.9759 85.6978 25.2673 86.3419 24.0112H90.8832C89.8204 27.3286 86.8894 29.551 82.6702 29.551ZM78.8375 19.0834H86.5352C86.0843 16.9255 84.7315 15.605 82.6702 15.605C80.6089 15.605 79.2562 16.9255 78.8375 19.0834Z" fill="currentColor" />
                                                <path d="M62.569 29.1645V12.4164H67.1425V15.5083C68.1731 13.1894 69.8801 12.2231 72.0703 12.2231H73.423V16.539H71.8448C69.0105 16.539 67.2713 17.7307 67.2713 21.499V29.1645H62.569Z" fill="currentColor" />
                                                <path d="M40.2032 29.1645V5.97485H45.292V16.7323L55.4053 5.97485H61.718L52.4422 15.3795L61.718 29.1645H55.6307L48.9637 18.9224L45.292 22.6585V29.1645H40.2032Z" fill="currentColor" />
                                            </g>
                                            <defs>
                                                <clipPath id="clip0_228_8">
                                                    <rect width="139.667" height="36" fill="white" />
                                                </clipPath>
                                                <clipPath id="clip1_228_8">
                                                    <rect width="28.5942" height="28.5942" fill="white" transform="translate(3.8587 3.73047)" />
                                                </clipPath>
                                                <clipPath id="clip2_228_8">
                                                    <rect width="7.35162" height="14.4189" fill="white" transform="translate(14.497 3.7345)" />
                                                </clipPath>
                                                <clipPath id="clip3_228_8">
                                                    <rect width="7.35162" height="14.4189" fill="white" transform="translate(14.497 17.9058)" />
                                                </clipPath>
                                                <clipPath id="clip4_228_8">
                                                    <rect width="16.0535" height="13.5124" fill="white" transform="translate(16.3182 7.70935)" />
                                                </clipPath>
                                                <clipPath id="clip5_228_8">
                                                    <rect width="16.0535" height="13.5124" fill="white" transform="translate(3.94006 14.8558)" />
                                                </clipPath>
                                                <clipPath id="clip6_228_8">
                                                    <rect width="17.6652" height="14.4425" fill="white" transform="translate(14.7062 13.9259)" />
                                                </clipPath>
                                            </defs>
                                        </svg>
                                    </Box>
                                </a>
                            </HStack>

                            <HStack gap={4}>
                                <Button size="sm" variant="ghost">v1.0.0</Button>
                                <IconButton aria-label="Search" variant="ghost" size="sm">
                                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                                </IconButton>
                                <ColorModeButton />
                                <IconButton aria-label="Logout" variant="ghost" size="sm" colorPalette="red" onClick={handleLogout}>
                                    <LogOut />
                                </IconButton>
                            </HStack>
                        </HStack>

                        {/* TABS LIST INSIDE HEADER */}
                        <Tabs.List borderBottomWidth="0">
                            {canViewCalculator && (
                                <Tabs.Trigger value="calculator" px={4} pb={3} _selected={{ color: "fg", borderColor: "fg" }}>
                                    <Text fontWeight="medium">Calculator</Text>
                                </Tabs.Trigger>
                            )}
                            {canViewTeamDB && (
                                <Tabs.Trigger value="team" px={4} pb={3} _selected={{ color: "fg", borderColor: "fg" }}>
                                    <Text fontWeight="medium">Team Database</Text>
                                </Tabs.Trigger>
                            )}
                            <Tabs.Trigger value="attendance" px={4} pb={3} _selected={{ color: "fg", borderColor: "fg" }}>
                                <Text fontWeight="medium">Attendance</Text>
                            </Tabs.Trigger>
                        </Tabs.List>
                    </Container>
                </Box>

                <Container maxW="container.xl" py={8}>
                    {/* TAB 1: CALCULATOR */}
                    <Tabs.Content value="calculator">
                        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>

                            {/* LEFT COLUMN: INPUTS */}
                            <Stack gap={6}>

                                {/* CARD 1: PROJECT CONTEXT */}
                                <Card.Root variant="elevated" shadow="none" border="1px solid" borderColor="border">
                                    <Card.Header>
                                        <HStack>
                                            <Briefcase size={20} color="gray" />
                                            <Heading size="md">Project Context</Heading>
                                        </HStack>
                                    </Card.Header>
                                    <Card.Body>
                                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                                            <Box>
                                                <Text fontSize="sm" fontWeight="medium" mb={1}>Project Revenue (USD)</Text>
                                                <NumberInputRoot
                                                    value={String(projectContext.revenue)}
                                                    onValueChange={(e) => setProjectContext(prev => ({ ...prev, revenue: isNaN(e.valueAsNumber) ? 0 : e.valueAsNumber }))}
                                                    formatOptions={{ style: "currency", currency: "USD", currencyDisplay: "code", currencySign: "accounting" }}
                                                    locale="en-US"
                                                >
                                                    <NumberInputField placeholder="0" />
                                                </NumberInputRoot>
                                            </Box>
                                            <Box>
                                                <Text fontSize="sm" fontWeight="medium" mb={1}>Exchange Rate (IDR)</Text>
                                                <NumberInputRoot
                                                    value={String(projectContext.exchangeRate)}
                                                    onValueChange={(e) => setProjectContext(prev => ({ ...prev, exchangeRate: isNaN(e.valueAsNumber) ? 0 : e.valueAsNumber }))}
                                                    formatOptions={{ style: "currency", currency: "IDR", currencyDisplay: "code", currencySign: "accounting" }}
                                                    locale="id-ID"
                                                >
                                                    <NumberInputField placeholder="0" />
                                                </NumberInputRoot>
                                            </Box>
                                            <Box>
                                                <Text fontSize="sm" fontWeight="medium" mb={1}>Hours per Day</Text>
                                                <NumberInputRoot
                                                    value={projectContext.hoursPerDay}
                                                    onValueChange={(e) => setProjectContext(prev => ({ ...prev, hoursPerDay: Number(e.value) }))}
                                                >
                                                    <NumberInputField />
                                                </NumberInputRoot>
                                            </Box>
                                            <Box>
                                                <Text fontSize="sm" fontWeight="medium" mb={1}>Platform Fee (%)</Text>
                                                <NumberInputRoot
                                                    value={projectContext.platformFeePercent}
                                                    onValueChange={(e) => setProjectContext(prev => ({ ...prev, platformFeePercent: Number(e.value) }))}
                                                >
                                                    <NumberInputField />
                                                </NumberInputRoot>
                                            </Box>
                                        </Grid>
                                    </Card.Body>
                                </Card.Root>

                                {/* CARD 2: TIMELINE ENGINE */}
                                <Card.Root variant="elevated" shadow="none" border="1px solid" borderColor="border">
                                    <Card.Header>
                                        <HStack justify="space-between">
                                            <HStack>
                                                <Calendar size={20} color="gray" />
                                                <Heading size="md">Timeline Engine</Heading>
                                            </HStack>
                                            <Badge colorPalette="purple" variant="subtle">Total: {totalDays} Days</Badge>
                                        </HStack>
                                    </Card.Header>
                                    <Card.Body>
                                        <Stack gap={4}>
                                            {phases.map((phase) => (
                                                <HStack key={phase.id} gap={4} align="end">
                                                    <Box flex={2}>
                                                        <Text fontSize="xs" mb={1}>Phase Name</Text>
                                                        <Input
                                                            value={phase.name}
                                                            onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                                                        />
                                                    </Box>
                                                    <Box flex={1}>
                                                        <Text fontSize="xs" mb={1}>Days</Text>
                                                        <NumberInputRoot
                                                            value={phase.days}
                                                            onValueChange={(e) => updatePhase(phase.id, 'days', Number(e.value))}
                                                        >
                                                            <NumberInputField />
                                                        </NumberInputRoot>
                                                    </Box>
                                                    <Box flex={1}>
                                                        <Text fontSize="xs" mb={1}>Buffer</Text>
                                                        <NumberInputRoot
                                                            value={phase.buffer}
                                                            onValueChange={(e) => updatePhase(phase.id, 'buffer', Number(e.value))}
                                                        >
                                                            <NumberInputField />
                                                        </NumberInputRoot>
                                                    </Box>
                                                    <IconButton
                                                        aria-label="Delete phase"
                                                        colorPalette="red"
                                                        variant="ghost"
                                                        onClick={() => removePhase(phase.id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </IconButton>
                                                </HStack>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={addPhase} mt={2}>
                                                <Plus size={16} /> Add New Phase
                                            </Button>
                                        </Stack>
                                    </Card.Body>
                                </Card.Root>

                                {/* CARD 3: SQUAD ALLOCATION */}
                                <Card.Root variant="elevated" shadow="none" border="1px solid" borderColor="border">
                                    <Card.Header>
                                        <HStack>
                                            <Users size={20} color="gray" />
                                            <Heading size="md">Squad Allocation</Heading>
                                        </HStack>
                                    </Card.Header>
                                    <Card.Body>
                                        <HStack mb={6}>
                                            <NativeSelectRoot>
                                                <NativeSelectField
                                                    placeholder="Select team member..."
                                                    value={selectedMemberId}
                                                    onChange={(e) => setSelectedMemberId(e.target.value)}
                                                >
                                                    {employees.map(member => ( // Use 'employees' from hook
                                                        <option key={member.id} value={member.id}>
                                                            {member.name} - {member.role} {isStakeholder && `(${formatCurrency(member.hourly_rate)}/hr)`}
                                                        </option>
                                                    ))}
                                                </NativeSelectField>
                                            </NativeSelectRoot>
                                            <Button onClick={addSquadMember} disabled={!selectedMemberId}>Add</Button>
                                        </HStack>

                                        <Stack gap={6} separator={<Separator />}>
                                            {squad.map((member) => {
                                                const memberTotalCost = member.hourly_rate * projectContext.hoursPerDay * totalDays * (member.allocation / 100);
                                                return (
                                                    <Box key={member.id}>
                                                        <HStack justify="space-between" mb={2}>
                                                            <HStack>
                                                                <Avatar size="sm" src={member.avatar} name={member.name} />
                                                                <Box>
                                                                    <Text fontWeight="bold" fontSize="sm">{member.name}</Text>
                                                                    <Text fontSize="xs" color="gray.500">{member.role}</Text>
                                                                </Box>
                                                            </HStack>
                                                            <HStack>
                                                                <Text fontWeight="bold" color="green.600">
                                                                    {isStakeholder ? formatCurrency(memberTotalCost) : '***'}
                                                                </Text>
                                                                <IconButton
                                                                    size="xs"
                                                                    variant="ghost"
                                                                    colorPalette="red"
                                                                    onClick={() => removeSquadMember(member.id)}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </IconButton>
                                                            </HStack>
                                                        </HStack>

                                                        <HStack gap={4}>
                                                            <Text fontSize="xs" whiteSpace="nowrap" w="80px">Alloc: {member.allocation}%</Text>
                                                            <Slider
                                                                value={[member.allocation]}
                                                                onValueChange={(e) => updateSquadAllocation(member.id, e.value[0])}
                                                                min={0}
                                                                max={100}
                                                                step={5}
                                                                width="100%"
                                                            />
                                                        </HStack>
                                                    </Box>
                                                );
                                            })}
                                            {squad.length === 0 && (
                                                <Text color="gray.400" textAlign="center" fontSize="sm">No team members allocated yet.</Text>
                                            )}
                                        </Stack>
                                    </Card.Body>
                                </Card.Root>

                            </Stack>

                            {/* RIGHT COLUMN: FINANCIAL HUD */}
                            <Box position="sticky" top="20px" h="fit-content">
                                <Card.Root variant="elevated" shadow="none" bg="gray.900" color="white" border="1px solid" borderColor="gray.900">
                                    <Card.Header>
                                        <HStack justify="space-between">
                                            <Heading size="md" color="white">Financial HUD</Heading>
                                            <DollarSign size={20} color="#48BB78" />
                                        </HStack>
                                    </Card.Header>
                                    <Card.Body>
                                        <Stack gap={6}>
                                            <Box>
                                                <Text color="gray.400" fontSize="sm">Est. Net Profit</Text>
                                                <Heading size="3xl" color={netProfit >= 0 ? "green.400" : "red.400"}>
                                                    {formatCurrency(netProfit)}
                                                </Heading>
                                            </Box>

                                            <HStack justify="space-between" bg="whiteAlpha.100" p={3} borderRadius="md">
                                                <Text fontSize="sm">Profit Margin</Text>
                                                <Badge
                                                    colorPalette={margin >= 30 ? "green" : margin >= 15 ? "yellow" : "red"}
                                                    variant="solid"
                                                    size="lg"
                                                >
                                                    {margin.toFixed(1)}% {margin >= 30 ? "(Healthy)" : margin >= 15 ? "(Okay)" : "(Critical)"}
                                                </Badge>
                                            </HStack>

                                            <Separator borderColor="whiteAlpha.300" />

                                            <Stack gap={2} fontSize="sm">
                                                <HStack justify="space-between">
                                                    <Text color="gray.400">Gross Revenue</Text>
                                                    <Text fontWeight="bold">{formatCurrency(projectContext.revenue)}</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text color="gray.400">Team Cost (COGS)</Text>
                                                    <Text fontWeight="bold" color="red.300">-{formatCurrency(squadCost)}</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text color="gray.400">Platform Fee ({projectContext.platformFeePercent}%)</Text>
                                                    <Text fontWeight="bold" color="red.300">-{formatCurrency(platformFee)}</Text>
                                                </HStack>
                                            </Stack>
                                        </Stack>
                                    </Card.Body>
                                </Card.Root>
                            </Box>

                        </Grid>
                    </Tabs.Content>

                    {/* TAB 2: TEAM DATABASE */}
                    <Tabs.Content value="team">
                        <Card.Root shadow="none" border="1px solid" borderColor="border">
                            <Card.Header>
                                <HStack justify="space-between">
                                    <Heading size="md">Team Database</Heading>
                                    <Button size="sm" onClick={openAddMemberDialog}>
                                        <Plus size={16} /> Add New Member
                                    </Button>
                                </HStack>
                            </Card.Header>
                            <Card.Body>
                                <Table.Root interactive>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeader>Member</Table.ColumnHeader>
                                            <Table.ColumnHeader>Email</Table.ColumnHeader>
                                            <Table.ColumnHeader>Role</Table.ColumnHeader>
                                            <Table.ColumnHeader>Rate / Hour (IDR)</Table.ColumnHeader>
                                            <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {isLoadingEmployees ? (
                                            <Table.Row>
                                                <Table.Cell colSpan={4} textAlign="center" py={4}>Loading team data...</Table.Cell>
                                            </Table.Row>
                                        ) : employees.length === 0 ? (
                                            <Table.Row>
                                                <Table.Cell colSpan={4} textAlign="center" py={4}>No team members found.</Table.Cell>
                                            </Table.Row>
                                        ) : (
                                            employees.map((member) => (
                                                <Table.Row key={member.id} _even={{ bg: { base: "gray.50", _dark: "whiteAlpha.50" } }}>
                                                    <Table.Cell>
                                                        <HStack>
                                                            <Avatar size="sm" name={member.name} />
                                                            <Text fontWeight="medium">{member.name}</Text>
                                                        </HStack>
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <Text>{member.email || "-"}</Text>
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <Text>{member.role}</Text>
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <Text>{formatCurrency(member.hourly_rate)}/hr</Text>
                                                    </Table.Cell>
                                                    <Table.Cell textAlign="end">
                                                        <HStack justify="end">
                                                            <IconButton
                                                                aria-label="Edit member"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openEditMemberDialog(member)}
                                                            >
                                                                <Edit2 size={16} />
                                                            </IconButton>
                                                            <IconButton
                                                                aria-label="Delete member"
                                                                colorPalette="red"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeTeamMember(member.id)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </IconButton>
                                                        </HStack>
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))
                                        )}
                                    </Table.Body>
                                </Table.Root>
                            </Card.Body>
                        </Card.Root>
                    </Tabs.Content>

                    {/* TAB 3: ATTENDANCE */}
                    <Tabs.Content value="attendance">
                        <Card.Root>
                            <Card.Body>
                                <Heading size="md" mb={4}>Attendance & Leave</Heading>
                                <Text color="gray.500">Attendance module coming soon...</Text>
                            </Card.Body>
                        </Card.Root>
                    </Tabs.Content>

                    {/* DIALOG FOR ADD/EDIT MEMBER */}
                    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingMember?.id ? 'Edit Member' : 'Add New Member'}</DialogTitle>
                            </DialogHeader>
                            <DialogBody>
                                <Stack gap={4}>
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" mb={1}>Name</Text>
                                        <Input
                                            value={editingMember?.name || ''}
                                            onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                        />
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" mb={1}>Email</Text>
                                        <Input
                                            value={editingMember?.email || ''}
                                            onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                                        />
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" mb={1}>Role</Text>
                                        <Input
                                            value={editingMember?.role || ''}
                                            onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                                        />
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" mb={1}>Hourly Rate (IDR)</Text>
                                        <NumberInputRoot
                                            value={String(editingMember?.hourly_rate || 0)}
                                            onValueChange={(e) => setEditingMember({ ...editingMember, hourly_rate: isNaN(e.valueAsNumber) ? 0 : e.valueAsNumber })}
                                            formatOptions={{ style: "currency", currency: "IDR", currencyDisplay: "code", currencySign: "accounting" }}
                                            locale="id-ID"
                                        >
                                            <NumberInputField placeholder="0" />
                                        </NumberInputRoot>
                                    </Box>
                                </Stack>
                            </DialogBody>
                            <DialogFooter>
                                <DialogActionTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogActionTrigger>
                                <Button onClick={() => editingMember?.id ? handleUpdateMember() : handleAddMember()}>Save</Button>
                            </DialogFooter>
                            <DialogCloseTrigger />
                        </DialogContent>
                    </DialogRoot>

                </Container>
            </Box>
        </Tabs.Root>
    );
};

export default AgencyOS;
