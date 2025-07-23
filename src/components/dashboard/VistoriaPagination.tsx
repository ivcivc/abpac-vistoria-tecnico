'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface VistoriaPaginationProps {
  paginationInfo: PaginationInfo;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPageSelector?: boolean;
  className?: string;
}

/**
 * Componente de paginação para o dashboard de vistorias
 *
 * Funcionalidades:
 * - Navegação entre páginas (primeira, anterior, próxima, última)
 * - Selector de itens por página
 * - Informações de navegação (página X de Y)
 * - Responsivo para mobile e desktop
 * - Desabilita botões quando apropriado
 */
export function VistoriaPagination({
  paginationInfo,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPageSelector = true,
  className = '',
}: VistoriaPaginationProps) {
  const { currentPage, itemsPerPage, totalItems, totalPages } = paginationInfo;

  // Opções de itens por página
  const itemsPerPageOptions = [5, 10, 20, 50];

  // Calcular range de itens sendo exibidos
  const itemRange = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return { start, end };
  }, [currentPage, itemsPerPage, totalItems]);

  // Gerar números de páginas para exibir
  const pageNumbers = useMemo(() => {
    const numbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Mostrar todas as páginas se houver poucas
      for (let i = 1; i <= totalPages; i++) {
        numbers.push(i);
      }
    } else {
      // Lógica mais complexa para muitas páginas
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);

      // Ajustar se estamos no início ou fim
      if (currentPage <= halfVisible) {
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - halfVisible) {
        startPage = totalPages - maxVisiblePages + 1;
      }

      // Adicionar primeira página e "..." se necessário
      if (startPage > 1) {
        numbers.push(1);
        if (startPage > 2) {
          numbers.push('...');
        }
      }

      // Adicionar páginas do meio
      for (let i = startPage; i <= endPage; i++) {
        numbers.push(i);
      }

      // Adicionar "..." e última página se necessário
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          numbers.push('...');
        }
        numbers.push(totalPages);
      }
    }

    return numbers;
  }, [currentPage, totalPages]);

  // Handlers para navegação
  const goToFirstPage = () => onPageChange(1);
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const goToLastPage = () => onPageChange(totalPages);
  const goToSpecificPage = (page: number) => onPageChange(page);

  // Handler para mudança de itens por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  // Se não há itens, não mostrar paginação
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Informações e seletor de itens por página */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
        <span>
          Mostrando {itemRange.start} a {itemRange.end} de {totalItems} vistorias
        </span>

        {showItemsPerPageSelector && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span>Itens por página:</span>
            <select
              value={itemsPerPage}
              onChange={e => handleItemsPerPageChange(Number(e.target.value))}
              className="h-8 px-2 py-1 border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controles de navegação */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Primeira página */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Página anterior */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Números de página */}
          <div className="flex items-center gap-1 mx-2">
            {pageNumbers.map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-sm text-muted-foreground">...</span>
                ) : (
                  <Button
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => goToSpecificPage(page as number)}
                    className="h-8 min-w-8 px-2"
                  >
                    {page}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Próxima página */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Última página */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Hook para gerenciar paginação
 */
export function usePagination<T>(items: T[], initialItemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const paginationInfo: PaginationInfo = useMemo(
    () => ({
      currentPage,
      itemsPerPage,
      totalItems: items.length,
      totalPages: Math.ceil(items.length / itemsPerPage),
    }),
    [currentPage, itemsPerPage, items.length]
  );

  // Items da página atual
  const currentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  // Handler para mudança de página
  const handlePageChange = (page: number) => {
    const clampedPage = Math.max(1, Math.min(page, paginationInfo.totalPages));
    setCurrentPage(clampedPage);
  };

  // Handler para mudança de itens por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset para primeira página
  };

  // Reset paginação quando items mudam drasticamente
  useEffect(() => {
    if (currentPage > paginationInfo.totalPages && paginationInfo.totalPages > 0) {
      setCurrentPage(paginationInfo.totalPages);
    }
  }, [currentPage, paginationInfo.totalPages]);

  return {
    paginationInfo,
    currentPageItems,
    handlePageChange,
    handleItemsPerPageChange,
    // Exposição de controles individuais para casos especiais
    setCurrentPage,
    setItemsPerPage,
  };
}
