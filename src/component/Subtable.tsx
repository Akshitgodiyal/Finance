import React, { useMemo, useState } from 'react';
import { Table, Input, Button, Modal, Form, Pagination, Select } from 'antd';
import {
    IconLayoutNavbarExpand,
    IconMaximize,
    IconPlus,
    IconSortAscending,
    IconSortDescending,
    IconFilter,
    IconArrowsSort,
} from '@tabler/icons-react';

const { Option } = Select;

interface DataType {
    key: string;
    category: string;
    '31-12-2021': number;
    '31-12-2022': number;
    '31-12-2024': number;
}

interface SubTableProps {
    data: DataType[];
    setData: React.Dispatch<React.SetStateAction<DataType[]>>;
    parentCategory: string;
}

const SubTable: React.FC<SubTableProps> = ({ data, setData, parentCategory }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [isExpandModalVisible, setIsExpandModalVisible] = useState(false);
    const [modalCurrentPage, setModalCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState<'profit' | 'loss' | null>(null);

    const calculateTotals = (): Record<string, number> => {
        return data.reduce(
            (acc, row) => {
                acc['31-12-2021'] += row['31-12-2021'];
                acc['31-12-2022'] += row['31-12-2022'];
                acc['31-12-2024'] += row['31-12-2024'];
                return acc;
            },
            { '31-12-2021': 0, '31-12-2022': 0, '31-12-2024': 0 }
        );
    };

    const totals = useMemo(calculateTotals, [data]);

    const handleInputChange = (value: string, key: string, column: string) => {
        const newData = [...data];
        const index = newData.findIndex((item) => key === item.key);
        if (index > -1) {
            const item:any = newData[index];
            item[column] = parseFloat(value) || 0;
            setData(newData);
        }
    };

    const calculateVariance = (row: DataType) => {
        return row['31-12-2024'] - row['31-12-2022'];
    };

    const calculateVariancePercentage = (row: DataType) => {
        return (
            ((row['31-12-2024'] - row['31-12-2022']) / row['31-12-2022']) * 100
        ).toFixed(1);
    };

    const calculateTotalVariance = (totals: Record<string, number>) => {
        return totals['31-12-2024'] - totals['31-12-2022'];
    };

    const calculateTotalVariancePercentage = (totals: Record<string, number>) => {
        return (
            ((totals['31-12-2024'] - totals['31-12-2022']) / totals['31-12-2022']) *
            100
        ).toFixed(1);
    };

    const handleSort = () => {
        if (sortOrder === null) {
            setSortOrder('profit');
        } else if (sortOrder === 'profit') {
            setSortOrder('loss');
        } else {
            setSortOrder(null);
        }
    };

    const sortedData = useMemo(() => {
        if (sortOrder === 'profit') {
            return [...data].sort((a, b) => {
                const varianceA = parseFloat(calculateVariancePercentage(a));
                const varianceB = parseFloat(calculateVariancePercentage(b));
                return varianceB - varianceA;
            });
        } else if (sortOrder === 'loss') {
            return [...data].sort((a, b) => {
                const varianceA = parseFloat(calculateVariancePercentage(a));
                const varianceB = parseFloat(calculateVariancePercentage(b));
                return varianceA - varianceB;
            });
        } else {
            return data;
        }
    }, [data, sortOrder]);

    const columns:any = [
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 200,
            render: (text: string) => <span className="font-semibold">{text}</span>,
        },
        {
            title: '31-12-2021',
            dataIndex: '31-12-2021',
            key: '31-12-2021',
            width: 150,
            render: (text: number) => <span>{text}</span>,
        },
        {
            title: '31-12-2022',
            dataIndex: '31-12-2022',
            key: '31-12-2022',
            width: 150,
            render: (text: number) => <span>{text}</span>,
        },
        {
            title: '31-12-2024',
            dataIndex: '31-12-2024',
            key: '31-12-2024',
            width: 150,
            render: (text: number, record: DataType) =>
                record.key === 'totals' ? (
                    <span className="font-semibold">{text}</span>
                ) : (
                    <Input
                        value={text}
                        onChange={(e:any) =>
                            handleInputChange(e.target.value, record.key, '31-12-2024')
                        }
                        className="border border-blue-300 rounded px-2 py-1"
                    />
                ),
        },
        {
            title: 'Variance',
            key: 'variance',
            width: 150,
            render: (text: string, record: DataType) => {
                const variance =
                    record.key === 'totals'
                        ? calculateTotalVariance(totals)
                        : calculateVariance(record);
                const varianceClass = variance >= 0 ? 'text-green-600' : 'text-red-600';
                return <span className={varianceClass}>{variance}</span>;
            },
        },
        {
            title: 'Variance %',
            key: 'variancePercentage',
            width: 150,
            render: (text: string, record: DataType) => {
                const variancePercentage =
                    record.key === 'totals'
                        ? calculateTotalVariancePercentage(totals)
                        : calculateVariancePercentage(record);
                const variancePercentageClass =
                    parseFloat(variancePercentage) >= 0 ? 'text-green-600' : 'text-red-600';
                return (
                    <span className={variancePercentageClass}>
                        {variancePercentage}%
                    </span>
                );
            },
        },
    ];

    const handleAddRow = () => {
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleOk = () => {
        form
            .validateFields()
            .then((values:any) => {
                const newData = [
                    ...data,
                    {
                        key: Date.now().toString(),
                        category: values.category,
                        '31-12-2021': parseFloat(values['31-12-2021']),
                        '31-12-2022': parseFloat(values['31-12-2022']),
                        '31-12-2024': parseFloat(values['31-12-2024']),
                    },
                ];
                setData(newData);
                setIsModalVisible(false);
                setCurrentPage(Math.ceil(newData.length / pageSize));
            })
            .catch((errorInfo:any) => {
                console.log('Validate Failed:', errorInfo);
            });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (value: number) => {
        setPageSize(value);
        setCurrentPage(1);
    };

    const handleModalPageChange = (page: number) => {
        setModalCurrentPage(page);
    };

    const paginatedData = sortedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const modalPaginatedData = sortedData.slice(
        (modalCurrentPage - 1) * 30,
        modalCurrentPage * 30
    );

    const dataSource = [
        ...paginatedData,
        {
            key: 'totals',
            category: (
                <span className="text-base font-bold text-gray-500">
                    Total {parentCategory}
                </span>
            ),
            '31-12-2021': (
                <span className="text-base font-bold text-gray-500">
                    {totals['31-12-2021']}
                </span>
            ),
            '31-12-2022': (
                <span className="text-base font-bold text-gray-500">
                    {totals['31-12-2022']}
                </span>
            ),
            '31-12-2024': (
                <span className="text-base font-bold text-gray-500">
                    {totals['31-12-2024']}
                </span>
            ),
            variance: (
                <span className="text-base font-bold text-gray-500">
                    {calculateTotalVariance(totals)}
                </span>
            ),
            variancePercentage: (
                <span className="text-base font-bold text-gray-500">
                    {calculateTotalVariancePercentage(totals)}
                </span>
            ),
        },
    ];

    const modalDataSource:any = [
        ...modalPaginatedData,
        {
            key: 'totals',
            category: (
                <span className="text-base font-bold text-gray-500">
                    Total {parentCategory}
                </span>
            ),
            '31-12-2021': (
                <span className="text-base font-bold text-gray-500">
                    {totals['31-12-2021']}
                </span>
            ),
            '31-12-2022': (
                <span className="text-base font-bold text-gray-500">
                    {totals['31-12-2022']}
                </span>
            ),
            '31-12-2024': (
                <span className="text-base font-bold text-gray-500">
                    {totals['31-12-2024']}
                </span>
            ),
            variance: (
                <span className="text-base font-bold text-gray-500">
                    {calculateTotalVariance(totals)}
                </span>
            ),
            variancePercentage: (
                <span className="text-base font-bold text-gray-500">
                    {calculateTotalVariancePercentage(totals)}
                </span>
            ),
        },
    ];

    const handleExpand = () => {
        setIsExpandModalVisible(true);
    };

    const handleExpandModalClose = () => {
        setIsExpandModalVisible(false);
    };

    return (
        <div className="mb-4">
            <div className="flex justify-between p-4 w-full mt-2 bg-sky-50">
                <div className="flex">
                    <h3 className="text-lg font-bold">{parentCategory}</h3>
                    <a
                        className="mx-3 p-1 cursor-pointer"
                        style={{
                            background:
                                sortOrder === 'profit'
                                    ? 'green'
                                    : sortOrder === 'loss'
                                    ? 'red'
                                    : 'white',
                        }}
                        onClick={handleSort}
                    >
                        {sortOrder === 'profit' ? (
                            <IconSortAscending color="white" width={18} />
                        ) : sortOrder === 'loss' ? (
                            <IconSortDescending width={18} color="white" />
                        ) : (
                            <IconArrowsSort width={18} color="black" />
                        )}
                    </a>
                </div>

                <div className="flex justify-center items-center ">
                    <a
                        onClick={handleAddRow}
                        className="mt-2 border cursor-pointer ml-auto border-blue-500 text-blue-700 font-bold rounded"
                    >
                        <IconPlus />
                    </a>
                    <a onClick={handleExpand} className="mx-2 pt-2 cursor-pointer">
                        <IconMaximize color="black" />
                    </a>
                </div>
            </div>

            <Table
                pagination={false}
                dataSource={dataSource}
                columns={columns}
                showHeader={false}
                rowClassName={(record:any ) =>
                    record.key === 'totals'
                        ? 'font-bold totals-row odd:bg-gray-100'
                        : 'odd:bg-gray-100 '
                }
                className="bg-white"
            />
            <div className="flex justify-between items-center mt-2">
                <Select
                    defaultValue={5}
                    onChange={handlePageSizeChange}
                    className="w-32"
                >
                    <Option value={5}>5</Option>
                    <Option value={10}>10</Option>
                    <Option value={20}>20</Option>
                    <Option value={30}>30</Option>
                </Select>
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={data.length}
                    onChange={handlePageChange}
                />
            </div>

            <Modal
                title="Add Sub-Row"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please input the category!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="31-12-2021"
                        label="31-12-2021"
                        rules={[
                            { required: true, message: 'Please input the value for 31-12-2021!' },
                        ]}
                    >
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item
                        name="31-12-2022"
                        label="31-12-2022"
                        rules={[
                            { required: true, message: 'Please input the value for 31-12-2022!' },
                        ]}
                    >
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item
                        name="31-12-2024"
                        label="31-12-2024"
                        rules={[
                            { required: true, message: 'Please input the value for 31-12-2024!' },
                        ]}
                    >
                        <Input type="number" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={parentCategory}
                open={isExpandModalVisible}
                onCancel={handleExpandModalClose}
                footer={null}
                width="70%"
                className="mt-5"
                style={{ top: 0 }}
                bodyStyle={{ height: '85vh', overflow: 'auto' }}
            >
                <div className="flex justify-between p-2 w-full ">
                    <h3 className="font-semibold"></h3>

                    <div className="flex justify-center items-center ">
                        <Button
                            className="mx-3 mt-2 pt-2 cursor-pointer"
                            style={{
                                background:
                                    sortOrder === 'profit'
                                        ? 'green'
                                        : sortOrder === 'loss'
                                        ? 'red'
                                        : 'white',
                            }}
                            onClick={handleSort}
                        >
                            {sortOrder === 'profit' ? (
                                <IconSortAscending color="white" />
                            ) : sortOrder === 'loss' ? (
                                <IconSortDescending color="white" />
                            ) : (
                                <IconArrowsSort color="black" />
                            )}
                        </Button>
                        <a
                            onClick={handleAddRow}
                            className="mt-2 border cursor-pointer ml-auto border-blue-500 text-blue-700 font-bold rounded"
                        >
                            <IconPlus />
                        </a>
                    </div>
                </div>
                <Table
                    pagination={false}
                    dataSource={modalDataSource}
                    columns={columns}
                    showHeader={true}
                    rowClassName={(record) =>
                        record.key === 'totals'
                            ? 'font-bold totals-row odd:bg-white even:bg-gray-100'
                            : 'even:bg-gray-100 odd:bg-white'
                    }
                />
                <Pagination
                    current={modalCurrentPage}
                    pageSize={30}
                    total={data.length}
                    onChange={handleModalPageChange}
                    className="mt-4"
                />
            </Modal>
        </div>
    );
};

export default SubTable;
