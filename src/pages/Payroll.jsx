import React from 'react';
import {
    Heading,
    Stack,
    Card,
    Table,
    HStack,
    Badge,
    Spinner,
    Center
} from '@chakra-ui/react';
import { DollarSign } from 'lucide-react';
import { usePayroll } from '../hooks/usePayroll';

const Payroll = () => {
    const { payrolls, isLoading } = usePayroll();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (isLoading) {
        return <Center h="50vh"><Spinner size="xl" /></Center>;
    }

    return (
        <Stack gap={8}>
            <Heading size="2xl">Payroll History</Heading>

            <Card.Root variant="outline" borderColor={{ base: "gray.200", _dark: "whiteAlpha.200" }}>
                <Card.Header>
                    <HStack gap={2}>
                        <DollarSign size={20} />
                        <Heading size="md">Salary Slips</Heading>
                    </HStack>
                </Card.Header>
                <Card.Body>
                    <Table.Root striped interactive>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>Period</Table.ColumnHeader>
                                <Table.ColumnHeader isNumeric>Total Hours</Table.ColumnHeader>
                                <Table.ColumnHeader isNumeric>Hourly Rate</Table.ColumnHeader>
                                <Table.ColumnHeader isNumeric>Bonus</Table.ColumnHeader>
                                <Table.ColumnHeader isNumeric>Deduction</Table.ColumnHeader>
                                <Table.ColumnHeader isNumeric>Total Salary</Table.ColumnHeader>
                                <Table.ColumnHeader>Status</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {payrolls?.map((slip) => (
                                <Table.Row key={slip.id}>
                                    <Table.Cell>
                                        {new Date(slip.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </Table.Cell>
                                    <Table.Cell isNumeric>{slip.total_hours}h</Table.Cell>
                                    <Table.Cell isNumeric>{formatCurrency(slip.hourly_rate)}</Table.Cell>
                                    <Table.Cell isNumeric color="green.500">+{formatCurrency(slip.bonus)}</Table.Cell>
                                    <Table.Cell isNumeric color="red.500">-{formatCurrency(slip.deduction)}</Table.Cell>
                                    <Table.Cell isNumeric fontWeight="bold">{formatCurrency(slip.total_amount)}</Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            colorPalette={slip.status === 'PAID' ? 'green' : 'yellow'}
                                            variant="subtle"
                                        >
                                            {slip.status}
                                        </Badge>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                            {payrolls?.length === 0 && (
                                <Table.Row>
                                    <Table.Cell colSpan={7} textAlign="center">No payroll history found.</Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Root>
                </Card.Body>
            </Card.Root>
        </Stack>
    );
};

export default Payroll;
