import { IconButton as ChakraIconButton } from "@chakra-ui/react"
import * as React from "react"
import { X } from "lucide-react"

export const CloseButton = React.forwardRef(
    function CloseButton(props, ref) {
        return (
            <ChakraIconButton variant="ghost" aria-label="Close" ref={ref} {...props}>
                {props.children ?? <X />}
            </ChakraIconButton>
        )
    },
)
