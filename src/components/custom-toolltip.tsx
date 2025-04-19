import React from "react";
import { TooltipProps } from "recharts";
import {
	NameType,
	ValueType,
} from "recharts/types/component/DefaultTooltipContent";

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
	formatter?: (value: any, name: any, props: any) => React.ReactNode;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
	active,
	payload,
	label,
	formatter,
}) => {
	if (!active || !payload || !payload.length) {
		return null;
	}

	return (
		<div className="custom-tooltip">
			<p className="tooltip-label">{label}</p>
			<div className="tooltip-content">
				{payload.map((entry, index) => (
					<div key={`item-${index}`} className="tooltip-item">
						<span
							className="tooltip-color"
							style={{ backgroundColor: entry.color }}
						/>
						<span className="tooltip-name">{entry.name}: </span>
						<span className="tooltip-value">
							{formatter
								? formatter(entry.value, entry.name, entry)
								: `$${Number(entry.value).toFixed(2)}`}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};
