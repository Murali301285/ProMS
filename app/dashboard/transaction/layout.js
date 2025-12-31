
import TransactionWrapper from "@/components/TransactionWrapper";

export default function TransactionLayout({ children }) {
    return (
        <TransactionWrapper>
            {children}
        </TransactionWrapper>
    );
}
