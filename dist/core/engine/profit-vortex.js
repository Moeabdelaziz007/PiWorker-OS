/**
 * PiWorker-OS ProfitVortex
 * Financial Lifeblood & Budget Cannibalism Logic
 */
export class ROICollapseException extends Error {
    agentId;
    currentRoi;
    constructor(agentId, currentRoi) {
        super(`[Profit Vortex] انهيار مالي حاد للوكيل ${agentId}: العائد ${currentRoi.toFixed(2)} أقل من حد البقاء.`);
        this.agentId = agentId;
        this.currentRoi = currentRoi;
        this.name = "ROICollapseException";
    }
}
export class ProfitVortex {
    sovereignTreasury = 0;
    /**
     * تقييم العائد الفعلي وتنفيذ "أكل الميزانية" إذا لزم الأمر
     */
    async evaluatePerformance(agent, actualRoi, currentBudget) {
        const minRequirement = agent.governance.minRoiRequirement;
        // إذا كان العائد أقل من المطلوب، نبدأ في استرداد رأس المال
        if (actualRoi < minRequirement) {
            return this.executeCannibalism(agent, actualRoi, currentBudget);
        }
        // إذا كان العائد ممتازاً، يتم تحديث الخزينة بنسبة الأرباح وتوزيع المكافأة
        const profit = currentBudget * (actualRoi - 1);
        if (profit > 0) {
            const taxAmount = profit * 0.1; // ضريبة سيادية 10%
            const rewardAmount = profit - taxAmount;
            this.sovereignTreasury += taxAmount;
            // توزيع مكافأة الـ Pi آلياً
            if (agent.walletAddress) {
                const { PiAdapter } = require("../finance/pi-adapter");
                PiAdapter.getInstance().transferRewards(agent.walletAddress, rewardAmount);
            }
        }
        return {
            isSolvent: true,
            cannibalizedAmount: 0,
            remainingBudget: currentBudget,
            actionTaken: "none",
        };
    }
    executeCannibalism(agent, actualRoi, currentBudget) {
        const minRequirement = agent.governance.minRoiRequirement;
        const severity = (minRequirement - actualRoi) / minRequirement;
        // إذا كان الانهيار المالي كارثياً (> 50%)
        if (severity > 0.5) {
            this.sovereignTreasury += currentBudget;
            throw new ROICollapseException(agent.id, actualRoi);
        }
        // أكل ميزانية جزئي
        const cannibalizedAmount = currentBudget * severity;
        this.sovereignTreasury += cannibalizedAmount;
        return {
            isSolvent: true,
            cannibalizedAmount,
            remainingBudget: currentBudget - cannibalizedAmount,
            actionTaken: "cannibalize",
        };
    }
    getTreasuryBalance() {
        return this.sovereignTreasury;
    }
}
