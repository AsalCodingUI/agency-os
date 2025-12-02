
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
    // --- AUTH & PROFILE ---
    const { user, profile, setProfile, logout, isStakeholder, isProjectManager } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        logout()
        navigate("/login")
    }

    // --- DATA FETCHING ---
    const { employees, isLoading: isLoadingEmployees, addEmployee, updateEmployee, deleteEmployee } = useEmployees()

    // --- STATE ---
    const [projectContext, setProjectContext] = useState({
        revenue: 15000,
        exchangeRate: 15500,
        hoursPerDay: 8,
        platformFeePercent: 10,
    });

    const [phases, setPhases] = useState(INITIAL_PHASES);
    const [squad, setSquad] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState("");

    // Team Database State (for Dialog)
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);

    // --- CALCULATIONS ---
    const totalDays = useMemo(() => phases.reduce((acc, phase) => acc + phase.days + phase.buffer, 0), [phases]);

    const squadCost = useMemo(() => {
        return squad.reduce((total, member) => {
            const memberCost = member.hourly_rate * projectContext.hoursPerDay * totalDays * (member.allocation / 100);
            return total + memberCost;
        }, 0);
    }, [squad, projectContext, totalDays]);

    const platformFee = (projectContext.revenue * projectContext.exchangeRate) * (projectContext.platformFeePercent / 100);
    const grossRevenueIDR = projectContext.revenue * projectContext.exchangeRate;
    const netProfit = grossRevenueIDR - squadCost - platformFee;
    const margin = (netProfit / grossRevenueIDR) * 100;

    // --- HANDLERS ---
    const updatePhase = (id, field, value) => {
        setPhases(phases.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const addPhase = () => {
        const newId = String(phases.length + 1);
        setPhases([...phases, { id: newId, name: 'New Phase', days: 5, buffer: 0 }]);
    };

    const removePhase = (id) => {
        setPhases(phases.filter(p => p.id !== id));
    };

    const addSquadMember = () => {
        const member = employees.find(e => e.id === selectedMemberId);
        if (member && !squad.find(s => s.id === member.id)) {
            setSquad([...squad, { ...member, allocation: 100 }]);
            setSelectedMemberId("");
        }
    };

    const removeSquadMember = (id) => {
        setSquad(squad.filter(m => m.id !== id));
    };

    const updateSquadAllocation = (id, value) => {
        setSquad(squad.map(m => m.id === id ? { ...m, allocation: value } : m));
    };

    // Dialog Handlers
    const openAddMemberDialog = () => {
        setEditingMember({ name: '', role: '', hourly_rate: 0, email: '' });
        setIsDialogOpen(true);
    };

    const openEditMemberDialog = (member) => {
        setEditingMember(member);
        setIsDialogOpen(true);
    };

    const handleAddMember = async () => {
        await addEmployee(editingMember);
        setIsDialogOpen(false);
    };

    const handleUpdateMember = async () => {
        await updateEmployee(editingMember);
        setIsDialogOpen(false);
    };

    const removeTeamMember = async (id) => {
        if (window.confirm("Are you sure you want to delete this member?")) {
            await deleteEmployee(id);
        }
    };

    // Helper
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <Box fontFamily="Inter, sans-serif">
            <Container maxW="container.xl" py={8}>
                <Grid templateColumns={{ base: "1fr", lg: "3fr 1fr" }} gap={8} alignItems="start">
                    {/* LEFT COLUMN: Main Calculator */}
                    <Stack gap={8}>
                        {/* ... (Project Context & Timeline Engine - No Changes) ... */}

                        {/* CARD 1: PROJECT CONTEXT */}
                        <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                            <Card.Header>
                                <HStack gap={3}>
                                    <Box p={2} bg="bg.subtle" color="fg.default" borderRadius="lg">
                                        <Briefcase size={20} />
                                    </Box>
                                    <Heading size="md">Project Context</Heading>
                                </HStack>
                            </Card.Header>
                            <Card.Body>
                                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" mb={1}>Project Revenue (USD)</Text>
                                        <NumberInputRoot
                                            value={String(projectContext.revenue)}
                                            onValueChange={(e) => setProjectContext(prev => ({ ...prev, revenue: isNaN(e.valueAsNumber) ? 0 : e.valueAsNumber }))}
                                            formatOptions={{ style: "currency", currency: "USD", currencyDisplay: "code", currencySign: "accounting" }}
                                            locale="en-US"
                                            disabled={!isStakeholder} // Only Stakeholder can edit revenue
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
                                            disabled={!isStakeholder}
                                        >
                                            <NumberInputField placeholder="0" />
                                        </NumberInputRoot>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" mb={1}>Hours per Day</Text>
                                        <NumberInputRoot
                                            value={projectContext.hoursPerDay}
                                            onValueChange={(e) => setProjectContext(prev => ({ ...prev, hoursPerDay: Number(e.value) }))}
                                            disabled={!isStakeholder}
                                        >
                                            <NumberInputField />
                                        </NumberInputRoot>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" fontWeight="medium" mb={1}>Platform Fee (%)</Text>
                                        <NumberInputRoot
                                            value={projectContext.platformFeePercent}
                                            onValueChange={(e) => setProjectContext(prev => ({ ...prev, platformFeePercent: Number(e.value) }))}
                                            disabled={!isStakeholder}
                                        >
                                            <NumberInputField />
                                        </NumberInputRoot>
                                    </Box>
                                </Grid>
                            </Card.Body>
                        </Card.Root>

                        {/* CARD 2: TIMELINE ENGINE */}
                        <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                            <Card.Header>
                                <HStack justify="space-between">
                                    <HStack gap={3}>
                                        <Box p={2} bg="bg.subtle" color="fg.default" borderRadius="lg">
                                            <Calendar size={20} />
                                        </Box>
                                        <Heading size="md">Timeline Engine</Heading>
                                    </HStack>
                                    <Badge variant="surface" colorPalette="gray">Total: {totalDays} Days</Badge>
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
                                                    disabled={!isStakeholder}
                                                />
                                            </Box>
                                            <Box flex={1}>
                                                <Text fontSize="xs" mb={1}>Days</Text>
                                                <NumberInputRoot
                                                    value={phase.days}
                                                    onValueChange={(e) => updatePhase(phase.id, 'days', Number(e.value))}
                                                    disabled={!isStakeholder}
                                                >
                                                    <NumberInputField />
                                                </NumberInputRoot>
                                            </Box>
                                            <Box flex={1}>
                                                <Text fontSize="xs" mb={1}>Buffer</Text>
                                                <NumberInputRoot
                                                    value={phase.buffer}
                                                    onValueChange={(e) => updatePhase(phase.id, 'buffer', Number(e.value))}
                                                    disabled={!isStakeholder}
                                                >
                                                    <NumberInputField />
                                                </NumberInputRoot>
                                            </Box>
                                            {isStakeholder && (
                                                <IconButton
                                                    aria-label="Delete phase"
                                                    colorPalette="red"
                                                    variant="ghost"
                                                    onClick={() => removePhase(phase.id)}
                                                >
                                                    <Trash2 size={18} />
                                                </IconButton>
                                            )}
                                        </HStack>
                                    ))}
                                    {isStakeholder && (
                                        <Button variant="outline" size="sm" onClick={addPhase} mt={2}>
                                            <Plus size={16} /> Add New Phase
                                        </Button>
                                    )}
                                </Stack>
                            </Card.Body>
                        </Card.Root>

                        {/* CARD 3: SQUAD ALLOCATION */}
                        <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                            <Card.Header>
                                <HStack gap={3}>
                                    <Box p={2} bg="bg.subtle" color="fg.default" borderRadius="lg">
                                        <Users size={20} />
                                    </Box>
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
                                            {employees.map(member => (
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
                                                        <Text fontWeight="bold" color={isStakeholder ? "green.600" : "gray.500"}>
                                                            {isStakeholder ? formatCurrency(memberTotalCost) : '******'}
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

                        {/* TEAM DATABASE (if stakeholder) */}
                        {isStakeholder && (
                            <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                                <Card.Header>
                                    <HStack justify="space-between">
                                        <HStack gap={3}>
                                            <Box p={2} bg="orange.50" color="orange.600" borderRadius="lg">
                                                <Users size={20} />
                                            </Box>
                                            <Heading size="md">Team Database</Heading>
                                        </HStack>
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
                                                    <Table.Cell colSpan={5} textAlign="center" py={4}>Loading team data...</Table.Cell>
                                                </Table.Row>
                                            ) : employees.length === 0 ? (
                                                <Table.Row>
                                                    <Table.Cell colSpan={5} textAlign="center" py={4}>No team members found.</Table.Cell>
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
                        )}
                    </Stack>

                    {/* RIGHT COLUMN: Financial HUD or Restricted View */}
                    <Stack gap={6} position="sticky" top="24">
                        {isStakeholder ? (
                            <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                                <Card.Header>
                                    <HStack justify="space-between">
                                        <Heading size="md">Financial HUD</Heading>
                                        <DollarSign size={20} />
                                    </HStack>
                                </Card.Header>
                                <Card.Body>
                                    <Stack gap={6}>
                                        <Box>
                                            <Text color="fg.muted" fontSize="sm">Est. Net Profit</Text>
                                            <Heading size="3xl" color={netProfit >= 0 ? "green.500" : "red.500"}>
                                                {formatCurrency(netProfit)}
                                            </Heading>
                                        </Box>

                                        <HStack justify="space-between" bg="bg.subtle" p={3} borderRadius="md">
                                            <Text fontSize="sm">Profit Margin</Text>
                                            <Badge
                                                colorPalette={margin >= 30 ? "green" : margin >= 15 ? "yellow" : "red"}
                                                variant="solid"
                                                size="lg"
                                            >
                                                {margin.toFixed(1)}% {margin >= 30 ? "(Healthy)" : margin >= 15 ? "(Okay)" : "(Critical)"}
                                            </Badge>
                                        </HStack>

                                        <Separator />

                                        <Stack gap={2} fontSize="sm">
                                            <HStack justify="space-between">
                                                <Text color="fg.muted">Gross Revenue</Text>
                                                <Text fontWeight="bold">{formatCurrency(projectContext.revenue)}</Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text color="fg.muted">Team Cost (COGS)</Text>
                                                <Text fontWeight="bold" color="red.500">-{formatCurrency(squadCost)}</Text>
                                            </HStack>
                                            <HStack justify="space-between">
                                                <Text color="fg.muted">Platform Fee ({projectContext.platformFeePercent}%)</Text>
                                                <Text fontWeight="bold" color="red.500">-{formatCurrency(platformFee)}</Text>
                                            </HStack>
                                        </Stack>
                                    </Stack>
                                </Card.Body>
                            </Card.Root>
                        ) : (
                            <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                                <Card.Header>
                                    <HStack justify="space-between">
                                        <Heading size="md">Project Summary</Heading>
                                        <Briefcase size={20} />
                                    </HStack>
                                </Card.Header>
                                <Card.Body>
                                    <Stack gap={4}>
                                        <Box>
                                            <Text color="fg.muted" fontSize="sm">Total Timeline</Text>
                                            <Heading size="2xl">{totalDays} Days</Heading>
                                        </Box>
                                        <Box>
                                            <Text color="fg.muted" fontSize="sm">Team Members</Text>
                                            <Heading size="xl">{squad.length} Active</Heading>
                                        </Box>
                                        <Badge colorPalette="blue" variant="solid" size="lg">
                                            Project Active
                                        </Badge>
                                    </Stack>
                                </Card.Body>
                            </Card.Root>
                        )}
                    </Stack>
                </Grid>

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
        </Box >
    );
};

export default AgencyOS;
