'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-media-query';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger, } from '@/components/ui/drawer';
const ModalContext = React.createContext(null);
function useContext() {
    const context = React.useContext(ModalContext);
    if (!context) {
        throw new Error('Trigger or Content must be used within <Modal>');
    }
    return context;
}
const Modal = ({ dialogProps, open, onOpenChange, drawerProps, children, mobileDirection = "bottom", }) => {
    const isMobile = useIsMobile();
    const Component = isMobile ? Drawer : Dialog;
    const props = isMobile ? { ...drawerProps, direction: mobileDirection } : dialogProps;
    return (<ModalContext.Provider value={{ isMobile, direction: mobileDirection }}>
      <Component open={open} onOpenChange={onOpenChange} {...props}>
        {children}
      </Component>
    </ModalContext.Provider>);
};
const ModalTrigger = ({ className, children, asChild, drawerProps, popoverProps, }) => {
    const { isMobile } = useContext();
    const Component = isMobile ? DrawerTrigger : DialogTrigger;
    const props = isMobile ? drawerProps : popoverProps;
    return (<Component className={className} asChild={asChild} {...props}>
      {children}
    </Component>);
};
const ModalClose = ({ className, children, asChild, drawerProps, popoverProps, }) => {
    const { isMobile } = useContext();
    const Component = isMobile ? DrawerClose : DialogClose;
    const props = isMobile ? drawerProps : popoverProps;
    return (<Component className={className} asChild={asChild} {...props}>
      {children}
    </Component>);
};
const ModalContent = ({ className, children, drawerProps, popoverProps, }) => {
    const { isMobile, direction } = useContext();
    const Component = isMobile ? DrawerContent : DialogContent;
    const props = isMobile ? { ...drawerProps, direction, showHandle: false } : popoverProps;
    return (<Component className={className} {...props}>
      {children}
    </Component>);
};
const ModalHeader = ({ className, ...props }) => {
    const { isMobile } = useContext();
    const Component = isMobile ? DrawerHeader : DialogHeader;
    return <Component className={className} {...props}/>;
};
const ModalTitle = ({ className, children, drawerProps, popoverProps, }) => {
    const { isMobile } = useContext();
    const Component = isMobile ? DrawerTitle : DialogTitle;
    const props = isMobile ? drawerProps : popoverProps;
    return (<Component className={className} {...props}>
      {children}
    </Component>);
};
const ModalDescription = ({ className, children, drawerProps, popoverProps, }) => {
    const { isMobile } = useContext();
    const Component = isMobile ? DrawerDescription : DialogDescription;
    const props = isMobile ? drawerProps : popoverProps;
    return (<Component className={className} {...props}>
      {children}
    </Component>);
};
const ModalBody = ({ className, ...props }) => {
    return <div className={cn('px-4 md:px-0', className)} {...props}/>;
};
const ModalFooter = ({ className, ...props }) => {
    const { isMobile } = useContext();
    const Component = isMobile ? DrawerFooter : DialogFooter;
    return <Component className={className} {...props}/>;
};
export { Modal, ModalTrigger, ModalClose, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalBody, ModalFooter, };
