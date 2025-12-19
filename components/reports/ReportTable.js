import { Search } from 'lucide-react';
import DataTable from '@/components/DataTable';
import styles from './ReportTable.module.css';

/**
 * Reusable Report Table Container
 * Simply wraps the DataTable with specific Report props and empty state handling.
 */
export default function ReportTable({
    columns,
    data,
    loading,
    reportName,
    fromDate,
    toDate,
    generated
}) {
    return (
        <div className={styles.container}>
            {generated ? (
                <div className={styles.tableWrapper}>
                    <DataTable
                        columns={columns}
                        data={data}
                        loading={loading}
                        fileName={`ProMS_${reportName.replace(/\s+/g, '_')}_Report`}
                        showSerialNo={true}
                        enableColumnVisibility={true}
                        reportHeader={{
                            title: `${reportName} Report`,
                            fromDate: fromDate,
                            toDate: toDate
                        }}
                    />
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.iconWrapper}>
                        <Search className={styles.emptyIcon} />
                    </div>
                    <h3 className={styles.emptyTitle}>No Data Generated</h3>
                    <p className={styles.emptyDesc}>Select filters above and click Generate View to see results</p>
                </div>
            )}
        </div>
    );
}
