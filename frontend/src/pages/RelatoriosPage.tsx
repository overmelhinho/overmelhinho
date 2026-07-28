
import AdminReportDashboard from "./reports/AdminReportDashboard";
import SalesReportsTab from "./reports/SalesReportsTab";
import CommissionReportsTab from "./reports/CommissionReportsTab";
import JobReportsTab from "./reports/JobReportsTab";
import { Tabs, Tab } from "@/components/ui/tabs";
import { LayoutDashboard, ShoppingCart, Percent, FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export default function RelatoriosPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    
    const tabs = ["geral", "vendas", "comissoes", "curriculos"];
    const currentTab = searchParams.get("tab");
    
    const activeTabIndex = currentTab ? tabs.indexOf(currentTab) : 0;
    const resolvedIndex = activeTabIndex === -1 ? 0 : activeTabIndex;

    const handleTabChange = (index: number) => {
        setSearchParams({ tab: tabs[index] }, { replace: true });
    };

    return (
        <div className="p-0">
            <div className="bg-white border-b border-gray-100 px-6 pt-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tighter">Relatórios e Inteligência</h1>
                    <p className="text-gray-400 font-medium text-xs">Acompanhamento de vendas, comissões e performance operacional.</p>
                </div>

                <Tabs selectedIndex={resolvedIndex} onChange={handleTabChange}>
                    <Tab 
                        title={
                            <div className="flex items-center gap-2">
                                <LayoutDashboard size={14} />
                                <span>Dashboard Geral</span>
                            </div>
                        }
                    >
                        <AdminReportDashboard hideHeader />
                    </Tab>
                    <Tab 
                        title={
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={14} />
                                <span>Relatório de Vendas</span>
                            </div>
                        }
                    >
                        <div className="p-0">
                            <SalesReportsTab />
                        </div>
                    </Tab>
                    <Tab 
                        title={
                            <div className="flex items-center gap-2">
                                <Percent size={14} />
                                <span>Comissões</span>
                            </div>
                        }
                    >
                        <CommissionReportsTab />
                    </Tab>
                    <Tab 
                        title={
                            <div className="flex items-center gap-2">
                                <FileText size={14} />
                                <span>Currículos Enviados</span>
                            </div>
                        }
                    >
                        <JobReportsTab />
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}
