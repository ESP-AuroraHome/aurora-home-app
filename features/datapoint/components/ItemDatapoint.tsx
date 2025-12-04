import { Item, ItemHeader } from "@/components/ui/item";
import { DataPoint, DataType } from "@prisma/client";
import { getTitleForDataType, getUnitForDataType } from "../utils/wording";
import IconDataType from "./IconDataType";
import ChartDataPoint from "./ChartDatapoint";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface Props {
  type: DataType;
  datapoints: DataPoint[];
}

const ItemDataPoint = ({ type, datapoints }: Props) => {
  const lastDatapoint = datapoints.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )[0];
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Item
          variant={"outline"}
          className="bg-black/4 backdrop-blur-xs border-gray-100/50 rounded-3xl"
        >
          <ItemHeader className="justify-start">
            <IconDataType type={type} />
            {getTitleForDataType(type)}
          </ItemHeader>
          <div className="flex justify-between items-center w-full">
            <ChartDataPoint data={datapoints} className="w-48 h-10" />
            <p className="text-3xl font-bold">
              {Number(lastDatapoint.value).toFixed(2)}{" "}
              <span className="font-normal">{getUnitForDataType(type)}</span>
            </p>
          </div>
        </Item>
      </DrawerTrigger>
      <DrawerContent className="bg-black/2 backdrop-blur-2xl border-gray-100/50">
        <DrawerHeader>
          <DrawerTitle className="text-white">
            {getTitleForDataType(type)}
          </DrawerTitle>
          <DrawerDescription className="text-white">
            Recent data points for {getTitleForDataType(type)}
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-10">
          <ChartDataPoint data={datapoints} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ItemDataPoint;
